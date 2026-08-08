"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageCircle, MessagesSquare } from "lucide-react";
import { api } from "@/lib/api-client";
import { getSocket } from "@/lib/socket";
import { timeAgo, initials } from "@/lib/format";
import type { OrderChatDto } from "@/lib/chats";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusMap: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Оплата", className: "bg-amber-500/15 text-amber-400" },
  PAID: { label: "Выдача", className: "bg-sky-500/15 text-sky-400" },
  DELIVERED: { label: "Доставлен", className: "bg-violet-500/15 text-violet-400" },
  COMPLETED: { label: "Завершён", className: "bg-emerald-500/15 text-emerald-400" },
  CANCELLED: { label: "Отменён", className: "bg-rose-500/15 text-rose-400" },
};

export function OrderChatsList({
  initial,
  userId,
}: {
  initial: OrderChatDto[];
  userId: string;
}) {
  const router = useRouter();
  const [chats, setChats] = useState<OrderChatDto[]>(initial);
  const initialRef = useRef(initial);

  const refresh = useCallback(async (silent = true) => {
    try {
      const d = await api<{ chats: OrderChatDto[] }>("/api/orders/chats");
      setChats(d.chats);
    } catch {
      if (!silent) router.refresh();
    }
  }, [router]);

  useEffect(() => {
    setChats(initialRef.current);
  }, [initial]);

  useEffect(() => {
    const socket = getSocket(userId);
    const onNew = () => refresh(true);
    socket.on("order:new-message", onNew);
    return () => {
      socket.off("order:new-message", onNew);
    };
  }, [userId, refresh]);

  useEffect(() => {
    const t = setInterval(() => refresh(true), 5000);
    return () => clearInterval(t);
  }, [refresh]);

  const totalUnread = chats.reduce((s, c) => s + c.unread, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Чаты</h1>
        {totalUnread > 0 && (
          <Badge className="bg-sky-500/15 text-sky-400">
            {totalUnread} непрочитанных
          </Badge>
        )}
      </div>

      {chats.length === 0 ? (
        <div className="rounded-3xl border border-border/80 bg-card/60 p-10 text-center">
          <MessagesSquare className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-lg font-semibold">Чатов пока нет</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Диалоги по заказам появятся здесь — покупатель и продавец обсуждают сделку прямо на странице заказа.
          </p>
          <Link
            href="/catalog"
            className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-primary/90"
          >
            Перейти в каталог
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {chats.map((c) => {
            const st = statusMap[c.status] ?? { label: c.status, className: "" };
            return (
              <Link
                key={c.id}
                href={`/orders/${c.id}`}
                className="flex items-center gap-3 rounded-3xl border border-border/80 bg-card/60 p-4 transition hover:border-primary/40 hover:bg-card sm:gap-4"
              >
                <Avatar className="h-12 w-12 shrink-0 ring-2 ring-border/60">
                  <AvatarImage src={c.counterpart.avatarUrl ?? undefined} alt={c.counterpart.name} />
                  <AvatarFallback>{initials(c.counterpart.name)}</AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold">{c.counterpart.name}</p>
                    <Badge className={cn("hidden shrink-0 sm:inline-flex", st.className)}>{st.label}</Badge>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {c.lastMessage ? (
                      <>
                        <span className={cn(c.lastMessage.senderId !== userId && "text-foreground/80")}>
                          {c.lastMessage.senderName ?? (c.lastMessage.senderId === userId ? "Вы" : c.counterpart.name)}:
                        </span>{" "}
                        {c.lastMessage.body}
                      </>
                    ) : (
                      "Сообщений пока нет — начните диалог по сделке"
                    )}
                  </p>
                  <p className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="truncate">{c.productTitle ?? "Товар"}</span>
                    <span className="hidden shrink-0 sm:inline">· № {c.id.slice(0, 8)}</span>
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  {c.lastMessage && (
                    <span className="text-[11px] text-muted-foreground">{timeAgo(c.lastMessage.createdAt)}</span>
                  )}
                  {c.unread > 0 ? (
                    <span className="grid h-5 min-w-5 place-items-center rounded-full bg-sky-500 px-1.5 text-[11px] font-bold text-white shadow-lg shadow-sky-500/40">
                      {c.unread > 99 ? "99+" : c.unread}
                    </span>
                  ) : (
                    <MessageCircle className="h-4 w-4 text-muted-foreground/40" />
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
