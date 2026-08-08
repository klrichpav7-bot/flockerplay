"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Camera, Check, Loader2, LoaderCircle, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { initials } from "@/lib/format";

export function ProfileSetupForm() {
  const { data: session } = useSession();
  const router = useRouter();
  const user = session?.user;

  const [name, setName] = useState(user?.name ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [nameTaken, setNameTaken] = useState(false);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!name.trim()) {
      setChecking(false);
      setNameTaken(false);
      return;
    }
    setChecking(true);
    const t = setTimeout(async () => {
      try {
        const d = await api<{ available: boolean; valid: boolean }>(`/api/check-name?name=${encodeURIComponent(name.trim())}`);
        setNameTaken(d.valid && !d.available);
      } catch {
        setNameTaken(false);
      } finally {
        setChecking(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [name]);

  async function handleFile(f: File | undefined) {
    if (!f) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error((data && data.error) || "Ошибка загрузки");
      setAvatarUrl(data.url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка загрузки фото");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (nameTaken) return toast.error("Этот никнейм уже занят");
    if (name.trim().length < 2) return toast.error("Никнейм должен быть не короче 2 символов");
    setSaving(true);
    try {
      await api("/api/profile/setup", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), avatarUrl: avatarUrl || undefined }),
      });
      toast.success("Профиль настроен! Добро пожаловать");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось сохранить профиль");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="glass-strong w-full max-w-md rounded-3xl p-8">
      <div className="mb-8 text-center">
        <h1 className="font-display text-2xl font-bold">Настройка профиля</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Придумайте уникальный никнейм и добавьте фото — {user?.email}
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <Avatar className="h-24 w-24 text-lg ring-2 ring-primary/40">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback>{initials(name || "?")}</AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full border border-border bg-card text-foreground shadow transition hover:border-primary/50"
              aria-label="Загрузить фото"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                void handleFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </div>
          <button type="button" onClick={() => inputRef.current?.click()} className="text-xs font-medium text-sky-400 hover:text-sky-300">
            Загрузить фотографию
          </button>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold" htmlFor="nickname">
            Никнейм / имя
          </label>
          <div className="relative">
            <input
              id="nickname"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например, ProGamer2026"
              maxLength={50}
              className="w-full rounded-xl border border-border bg-card px-4 py-2.5 pr-10 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
            />
            {checking && <LoaderCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
            {!checking && name.trim().length >= 2 && !nameTaken && (
              <Check className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-400" />
            )}
            {!checking && nameTaken && (
              <X className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-400" />
            )}
          </div>
          {nameTaken ? (
            <p className="text-xs text-rose-400">Этот никнейм уже занят</p>
          ) : name.trim().length >= 2 && !checking ? (
            <p className="text-xs text-emerald-400">Никнейм свободен</p>
          ) : (
            <p className="text-xs text-muted-foreground">Минимум 2 символа, проверяем уникальность автоматически</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={saving || checking || nameTaken || !name.trim()}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Готово
        </Button>
      </form>
    </div>
  );
}
