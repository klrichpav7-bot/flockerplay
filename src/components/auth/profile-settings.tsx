"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Camera, Check, KeyRound, Loader2, LoaderCircle, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordStrength } from "@/components/auth/password-strength";
import { initials } from "@/lib/format";

export function ProfileSettings() {
  const { data: session, update } = useSession();
  const user = session?.user;

  const [name, setName] = useState(user?.name ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [nameTaken, setNameTaken] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!name.trim() || name.trim() === user?.name) {
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
  }, [name, user?.name]);

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

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (nameTaken) return toast.error("Этот никнейм уже занят");
    setSavingProfile(true);
    try {
      await api("/api/profile", {
        method: "PATCH",
        body: JSON.stringify({ name: name.trim(), avatarUrl: avatarUrl || undefined }),
      });
      await update({ name: name.trim(), avatarUrl: avatarUrl || undefined });
      toast.success("Профиль обновлён");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось сохранить");
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 6) return toast.error("Пароль должен быть не короче 6 символов");
    if (newPassword !== confirmPassword) return toast.error("Пароли не совпадают");
    setSavingPassword(true);
    try {
      await api("/api/profile/password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      toast.success("Пароль изменён");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось сменить пароль");
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={saveProfile} className="rounded-3xl border border-border/80 bg-card/60 p-6">
        <h2 className="mb-5 font-semibold">Основные данные</h2>
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={avatarUrl || undefined} />
            <AvatarFallback className="text-lg">{initials(name || "?")}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              Загрузить фото
            </Button>
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
        </div>

        <div className="mt-5 space-y-2">
          <Label htmlFor="nickname">Никнейм / имя</Label>
          <div className="relative">
            <Input
              id="nickname"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              className="pr-10"
            />
            {checking && <LoaderCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
            {!checking && name.trim().length >= 2 && !nameTaken && name.trim() !== user?.name && (
              <Check className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-400" />
            )}
            {!checking && nameTaken && <X className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-400" />}
          </div>
          {nameTaken ? (
            <p className="text-xs text-rose-400">Этот никнейм уже занят</p>
          ) : (
            <p className="text-xs text-muted-foreground">Уникальность проверяется автоматически</p>
          )}
        </div>

        <Button type="submit" className="mt-5" disabled={savingProfile || checking || nameTaken}>
          {savingProfile && <Loader2 className="h-4 w-4 animate-spin" />}
          Сохранить
        </Button>
      </form>

      <form onSubmit={changePassword} className="rounded-3xl border border-border/80 bg-card/60 p-6">
        <h2 className="mb-5 flex items-center gap-2 font-semibold">
          <KeyRound className="h-4 w-4 text-sky-400" /> Смена пароля
        </h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current">Текущий пароль</Label>
            <Input
              id="current"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
            />
            <p className="text-[11px] text-muted-foreground">Для аккаунтов Google поле не требуется</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="new">Новый пароль</Label>
            <Input
              id="new"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Минимум 6 символов"
            />
            {newPassword && <PasswordStrength password={newPassword} />}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Повторите пароль</Label>
            <Input
              id="confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ещё раз"
            />
            {confirmPassword && confirmPassword !== newPassword && (
              <p className="text-xs text-rose-400">Пароли не совпадают</p>
            )}
          </div>
        </div>
        <Button type="submit" className="mt-5" disabled={savingPassword || newPassword.length < 6}>
          {savingPassword && <Loader2 className="h-4 w-4 animate-spin" />}
          Сменить пароль
        </Button>
      </form>
    </div>
  );
}
