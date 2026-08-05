"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Headphones, Loader2, Lock, Send, User } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { getSocket } from "@/lib/socket";
import { VerifiedBadge } from "@/components/shared/verified-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate, timeAgo, initials } from "@/lib/format";

interface AdminTicket {
  id: string;
  subject: string;
  status: "OPEN" | "IN_PROGRESS" | "CLOSED";
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string; isVerified: boolean; avatarUrl: string | null };
  messages: { id: string; senderId: string; body: string; createdAt: string }[];
  _count: { messages: number };
}

interface ChatMessage {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
}

interface TicketDetail {
  id: string;
  subject: string;
  status: string;
  user: { id: string; name: string; isVerified: boolean; avatarUrl: string | null };
  messages: ChatMessage[];
}

const statusLabel: Record<string, { label: string; className: string }> = {
  OPEN: { label: "Открыт", className: "bg-sky-500/15 text-sky-400" },
  IN_PROGRESS: { label: "В работе", className: "bg-amber-500/15 text-amber-400" },
  CLOSED: { label: "Закрыт", className: "bg-muted text-muted-foreground" },
};

export function AdminSupport({ adminId, adminName }: { adminId: string; adminName: string }) {
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [body, setBody] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingName, setTypingName] = useState("");
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadTickets = useCallback(async () => {
    try {
      const d = await api<{ tickets: AdminTicket[] }>("/api/admin/tickets");
      setTickets(d.tickets);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const openTicket = useCallback(async (id: string) => {
    setActiveId(id);
    setLoadingMessages(true);
    setTicket(null);
    try {
      const d = await api<{ ticket: TicketDetail }>(`/api/support/tickets/${id}`);
      setTicket(d.ticket);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    const socket = getSocket(adminId);
    const onNewMessage = (data: { ticketId: string; userId?: string; senderId: string; message: ChatMessage }) => {
      if (data.ticketId === activeId) {
        setTicket((prev) =>
          prev && !prev.messages.some((m) => m.id === data.message.id)
            ? { ...prev, messages: [...prev.messages, data.message] }
            : prev
        );
      }
      loadTickets();
    };
    const onTyping = (data: { isTyping: boolean; from: string; userId?: string }) => {
      if (data.from === "user") {
        setIsTyping(data.isTyping);
        if (data.isTyping) {
          const t = tickets.find((x) => x.user.id === data.userId);
          setTypingName(t?.user.name ?? "Пользователь");
        }
      }
    };
    socket.on("support:new-message", onNewMessage);
    socket.on("support:typing", onTyping);
    return () => {
      socket.off("support:new-message", onNewMessage);
      socket.off("support:typing", onTyping);
    };
  }, [activeId, adminId, loadTickets, tickets]);

  useEffect(() => {
    if (!activeId) return;
    const timer = setInterval(async () => {
      try {
        const d = await api<{ ticket: TicketDetail }>(`/api/support/tickets/${activeId}`);
        setTicket(d.ticket);
        loadTickets();
      } catch {
        /* ignore */
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [activeId, loadTickets]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [ticket?.messages.length, isTyping, loadingMessages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!activeId || !body.trim() || sending) return;
    setSending(true);
    try {
      const d = await api<{ message: ChatMessage }>(`/api/support/tickets/${activeId}`, {
        method: "POST",
        body: JSON.stringify({ body: body.trim() }),
      });
      setTicket((prev) => (prev ? { ...prev, messages: [...prev.messages, d.message] } : prev));
      setBody("");
      getSocket(adminId).emit("support:stopTyping", { ticketId: activeId });
      loadTickets();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setSending(false);
    }
  }

  function handleTyping(value: string) {
    setBody(value);
    if (!activeId) return;
    const socket = getSocket(adminId);
    socket.emit("support:typing", { ticketId: activeId });
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => socket.emit("support:stopTyping", { ticketId: activeId }), 1200);
  }

  async function closeTicket() {
    if (!activeId) return;
    try {
      await api(`/api/support/tickets/${activeId}/close`, { method: "POST" });
      toast.success("Тикет закрыт");
      setTicket((prev) => (prev ? { ...prev, status: "CLOSED" } : prev));
      loadTickets();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    }
  }

  const active = ticket;

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      <div className="flex flex-col rounded-3xl border border-border/80 bg-card/60 p-4">
        <h2 className="mb-3 text-sm font-semibold">Обращения ({tickets.length})</h2>
        <div className="-mr-1 flex max-h-[65vh] flex-col gap-1.5 overflow-y-auto pr-1">
          {loadingList ? (
            <Loader2 className="mx-auto my-8 h-5 w-5 animate-spin text-muted-foreground" />
          ) : tickets.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Обращений нет</p>
          ) : (
            tickets.map((t) => (
              <button
                key={t.id}
                onClick={() => openTicket(t.id)}
                className={`rounded-2xl px-3.5 py-3 text-left transition ${
                  activeId === t.id ? "bg-violet-600/15 ring-1 ring-violet-500/30" : "hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 truncate text-sm font-medium">
                    {t.user.name} {t.user.isVerified && <VerifiedBadge size="xs" />}
                  </span>
                  <Badge className={statusLabel[t.status]?.className ?? ""}>{statusLabel[t.status]?.label ?? t.status}</Badge>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{t.subject}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {t._count.messages} сообщ. · {timeAgo(t.updatedAt)}
                </p>
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
                <Headphones className="h-8 w-8 text-violet-400" />
              </div>
              <p className="font-semibold">Чат поддержки</p>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                Выберите обращение слева, чтобы ответить пользователю.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={active.user.avatarUrl ?? undefined} />
                  <AvatarFallback className="text-[10px]">{initials(active.user.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 truncate font-semibold">
                    {active.user.name} {active.user.isVerified && <VerifiedBadge size="xs" />}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{active.subject}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {statusLabel[active.status] && (
                  <Badge className={statusLabel[active.status]?.className}>{statusLabel[active.status]?.label}</Badge>
                )}
                {active.status !== "CLOSED" && (
                  <Button variant="outline" size="sm" onClick={closeTicket}>
                    <Lock className="h-3.5 w-3.5" /> Закрыть
                  </Button>
                )}
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
              {loadingMessages ? (
                <Loader2 className="mx-auto my-10 h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                active.messages.map((m) => {
                  const mine = m.senderId === adminId;
                  return (
                    <div key={m.id} className={`flex items-end gap-2 ${mine ? "flex-row-reverse" : ""}`}>
                      {!mine && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={active.user.avatarUrl ?? undefined} />
                          <AvatarFallback className="text-[10px]">{initials(active.user.name)}</AvatarFallback>
                        </Avatar>
                      )}
                      <div className={`max-w-[75%] ${mine ? "items-end text-right" : "items-start"}`}>
                        <div
                          className={`rounded-2xl px-4 py-2.5 text-sm ${
                            mine ? "bg-violet-600 text-white" : "bg-muted/60 text-foreground"
                          }`}
                        >
                          {m.body}
                        </div>
                        <p className="mt-1 flex items-center gap-1 px-1 text-[11px] text-muted-foreground">
                          {mine ? <User className="h-3 w-3" /> : null}
                          {mine ? "Вы" : active.user.name} · {formatDate(m.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              {isTyping && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> {typingName} печатает…
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={sendMessage} className="flex gap-2 border-t border-border/60 p-4">
              <Input
                value={body}
                onChange={(e) => handleTyping(e.target.value)}
                placeholder="Ответить от имени поддержки…"
                disabled={active.status === "CLOSED" || sending}
              />
              <Button type="submit" disabled={!body.trim() || sending || active.status === "CLOSED"}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
