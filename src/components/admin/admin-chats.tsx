"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, MessageSquareText, Search, UserRound } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { VerifiedBadge } from "@/components/shared/verified-badge";
import { UserCardDialog } from "@/components/admin/user-card";
import type { AdminChatDto } from "@/app/api/admin/chats/route";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice, initials, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const statusMap: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Оплата", className: "bg-amber-500/15 text-amber-400" },
  PAID: { label: "Выдача", className: "bg-sky-500/15 text-sky-400" },
  DELIVERED: { label: "Доставлен", className: "bg-violet-500/15 text-violet-400" },
  COMPLETED: { label: "Завершён", className: "bg-emerald-500/15 text-emerald-400" },
  CANCELLED: { label: "Отменён", className: "bg-rose-500/15 text-rose-400" },
};

export function AdminChats() {
  const [chats, setChats] = useState<AdminChatDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [cardTarget, setCardTarget] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const d = await api<{ chats: AdminChatDto[] }>("/api/admin/chats");
      setChats(d.chats);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [load]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return chats;
    return chats.filter(
      (c) =>
        c.buyer.name.toLowerCase().includes(query) ||
        c.seller.name.toLowerCase().includes(query) ||
        (c.productTitle ?? "").toLowerCase().includes(query)
    );
  }, [chats, q]);

  const active = chats.find((c) => c.id === activeId) ?? null;

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <div className="flex flex-col rounded-3xl border border-border/80 bg-card/60 p-4">
        <div className="relative mb-3">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск по участникам…"
            className="pl-10"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="-mr-1 flex max-h-[65vh] flex-col gap-1.5 overflow-y-auto pr-1">
          {loading ? (
            <Loader2 className="mx-auto my-8 h-5 w-5 animate-spin text-muted-foreground" />
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Диалогов нет</p>
          ) : (
            filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`rounded-2xl px-3.5 py-3 text-left transition ${
                  activeId === c.id ? "bg-violet-600/15 ring-1 ring-violet-500/30" : "hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">{c.buyer.name}</span>
                  <span className="text-muted-foreground">↔</span>
                  <span className="truncate text-sm font-medium">{c.seller.name}</span>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {c.productTitle ?? "Товар"} · {formatPrice(c.total)}
                </p>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {c.lastMessage ? `${c.lastMessage.senderName}: ${c.lastMessage.body}` : "Сообщений пока нет"}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">{timeAgo(c.lastMessage?.createdAt ?? c.createdAt)}</p>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex min-h-[65vh] flex-col rounded-3xl border border-border/80 bg-card/60">
        {!active ? (
          <div className="grid flex-1 place-items-center p-10 text-center">
            <div>
              <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-violet-600/15">
                <MessageSquareText className="h-8 w-8 text-violet-400" />
              </div>
              <p className="font-semibold">Диалоги пользователей</p>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                Выберите диалог слева, чтобы увидеть переписку и участников сделки.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-4">
              <div className="min-w-0">
                <p className="truncate font-semibold">{active.productTitle ?? "Товар"}</p>
                <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                  № {active.id.slice(0, 8)} · {formatPrice(active.total)} · {timeAgo(active.createdAt)}
                </p>
              </div>
              <Badge className={statusMap[active.status]?.className ?? ""}>
                {statusMap[active.status]?.label ?? active.status}
              </Badge>
            </div>

            <div className="space-y-4 overflow-y-auto px-5 py-5">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={active.buyer.avatarUrl ?? undefined} alt={active.buyer.name} />
                    <AvatarFallback className="text-xs">{initials(active.buyer.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 truncate text-sm font-semibold">
                      {active.buyer.name} {active.buyer.isVerified && <VerifiedBadge size="xs" />}
                    </p>
                    <p className="text-xs text-muted-foreground">Покупатель</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setCardTarget(active.buyer.id)}>
                  <UserRound className="h-3.5 w-3.5" /> О нём
                </Button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={active.seller.avatarUrl ?? undefined} alt={active.seller.name} />
                    <AvatarFallback className="text-xs">{initials(active.seller.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 truncate text-sm font-semibold">
                      {active.seller.name} {active.seller.isVerified && <VerifiedBadge size="xs" />}
                    </p>
                    <p className="text-xs text-muted-foreground">Продавец</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setCardTarget(active.seller.id)}>
                  <UserRound className="h-3.5 w-3.5" /> О нём
                </Button>
              </div>

              {active.messages.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Сообщений в этом диалоге пока нет
                </p>
              ) : (
                active.messages.map((m) => {
                  const isBuyer = m.senderId === active.buyer.id;
                  const user = isBuyer ? active.buyer : active.seller;
                  return (
                    <div key={m.id} className={cn("flex items-end gap-2", !isBuyer && "flex-row-reverse")}>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name} />
                        <AvatarFallback className="text-[10px]">{initials(user.name)}</AvatarFallback>
                      </Avatar>
                      <div className={cn("max-w-[75%]", isBuyer ? "items-start" : "items-end text-right")}>
                        <div
                          className={cn(
                            "rounded-2xl px-4 py-2.5 text-sm",
                            isBuyer ? "bg-violet-600 text-white" : "bg-muted/60 text-foreground"
                          )}
                        >
                          {m.body}
                        </div>
                        <p className="mt-1 flex items-center gap-1 px-1 text-[11px] text-muted-foreground">
                          {m.senderName} · {timeAgo(m.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>

      <UserCardDialog userId={cardTarget} open={!!cardTarget} onOpenChange={(o) => !o && setCardTarget(null)} />
    </div>
  );
}
