"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { VerifiedBadge } from "@/components/shared/verified-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface FoundUser {
  id: string;
  name: string;
  email: string;
  isVerified: boolean;
  isSeller: boolean;
}

const reasons = [
  "Мошенничество",
  "Не получил товар",
  "Задержка доставки",
  "Некачественный товар",
  "Оскорбление",
  "Другое",
];

export function ComplaintForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTargetId = searchParams.get("targetId");

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoundUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [target, setTarget] = useState<FoundUser | null>(null);
  const [reason, setReason] = useState(reasons[0]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialTargetId) {
      api<{ users: FoundUser[] }>(`/api/users/lookup?q=${initialTargetId}`)
        .then((d) => {
          const u = d.users.find((x) => x.id === initialTargetId);
          if (u) setTarget(u);
        })
        .catch(() => {});
    }
  }, [initialTargetId]);

  async function search() {
    if (query.trim().length < 2) return;
    setSearching(true);
    try {
      const d = await api<{ users: FoundUser[] }>(`/api/users/lookup?q=${encodeURIComponent(query.trim())}`);
      setResults(d.users);
      if (d.users.length === 0) toast.info("Никого не найдено");
    } catch {
      toast.error("Ошибка поиска");
    } finally {
      setSearching(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!target) {
      toast.error("Выберите пользователя из списка");
      return;
    }
    setLoading(true);
    try {
      await api("/api/complaints", {
        method: "POST",
        body: JSON.stringify({ targetId: target.id, reason, text }),
      });
      toast.success("Жалоба отправлена администрации");
      router.push("/dashboard/complaints");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5 rounded-3xl border border-border/80 bg-card/60 p-6">
      <div className="space-y-2">
        <Label>На кого жалуетесь</Label>
        {target ? (
          <div className="flex items-center justify-between rounded-2xl border border-border bg-card/60 px-4 py-3">
            <span className="inline-flex items-center gap-2 text-sm font-semibold">
              {target.name} {target.isVerified && <VerifiedBadge size="xs" />}
            </span>
            <button type="button" onClick={() => setTarget(null)} className="text-xs text-muted-foreground transition hover:text-rose-400">
              Изменить
            </button>
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Введите имя или email продавца…"
                  className="pl-10"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), search())}
                />
              </div>
              <Button type="button" variant="secondary" onClick={search} disabled={searching}>
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
            {results.length > 0 && (
              <div className="mt-2 space-y-1">
                {results.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setTarget(u)}
                    className="flex w-full items-center justify-between rounded-xl border border-border bg-card/60 px-4 py-2.5 text-left text-sm transition hover:border-primary/40"
                  >
                    <span className="inline-flex items-center gap-2">
                      {u.name} {u.isVerified && <VerifiedBadge size="xs" />}
                    </span>
                    <span className="text-xs text-muted-foreground">{u.isSeller ? "Продавец" : "Покупатель"}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="reason">Причина</Label>
        <select
          id="reason"
          className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary/60"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        >
          {reasons.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="text">Описание ситуации</Label>
        <Textarea
          id="text"
          rows={5}
          placeholder="Опишите, что произошло: номер заказа, дата, детали…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading || !target}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Отправить жалобу
      </Button>
    </form>
  );
}
