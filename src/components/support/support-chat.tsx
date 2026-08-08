"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Headphones, Loader2, Plus, Send, ShieldAlert, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { getSocket } from "@/lib/socket";
import { DealContext, type DealOrder } from "@/components/support/deal-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDate, timeAgo, initials } from "@/lib/format";
import { cn } from "@/lib/utils";

interface TicketSummary {
  id: string;
  subject: string;
  status: string;
  orderId: string | null;
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
  orderId: string | null;
  user: { id: string; name: string; avatarUrl: string | null };
  order: DealOrder | null;
  messages: ChatMessage[];
}

const statusLabel: Record<string, { label: string; className: string }> = {
  OPEN: { label: "Открыт", className: "bg-sky-500/15 text-sky-400" },
  IN_PROGRESS: { label: "В работе", className: "bg-amber-500/15 text-amber-400" },
  CLOSED: { label: "Закрыт", className: "bg-muted text-muted-foreground" },
};

export function SupportChat({ userId, userName }: { userId: string; userName: string }) {
  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [body, setBody] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newText, setNewText] = useState("");
  const [creating, setCreating] = useState(false);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const autoTicket = searchParams.get("ticket");

  const loadTickets = useCallback(async () => {
    try {
      const d = await api<{ tickets: TicketSummary[] }>("/api/support/tickets");
      setTickets(d.tickets);
    } catch {
      toast.error("Не удалось загрузить тикеты");
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
    if (autoTicket) {
      openTicket(autoTicket);
    }
  }, [autoTicket, openTicket]);

  useEffect(() => {
    const socket = getSocket(userId);
    const onNewMessage = (data: { ticketId: string; message: ChatMessage }) => {
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
      if (data.from !== "user" && activeId) setIsTyping(data.isTyping);
    };
    socket.on("support:new-message", onNewMessage);
    socket.on("support:typing", onTyping);
    return () => {
      socket.off("support:new-message", onNewMessage);
      socket.off("support:typing", onTyping);
    };
  }, [activeId, userId, loadTickets]);

  useEffect(() => {
    if (!activeId) return;
    const timer = setInterval(async () => {
      try {
        const d = await api<{ ticket: TicketDetail }>(`/api/support/tickets/${activeId}`);
        setTicket(d.ticket);
        loadTickets();
      } catch {
        /* тикет мог быть закрыт */
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
      getSocket(userId).emit("support:stopTyping", { ticketId: activeId });
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
    const socket = getSocket(userId);
    socket.emit("support:typing", { ticketId: activeId });
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => socket.emit("support:stopTyping", { ticketId: activeId }), 1200);
  }

  async function createTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!newSubject.trim() || creating) return;
    setCreating(true);
    try {
      const d = await api<{ ticket: { id: string } }>("/api/support/tickets", {
        method: "POST",
        body: JSON.stringify({ subject: newSubject.trim(), firstMessage: newText.trim() }),
      });
      setShowNew(false);
      setNewSubject("");
      setNewText("");
      await loadTickets();
      openTicket(d.ticket.id);
      toast.success("Тикет создан");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setCreating(false);
    }
  }

  const activeTicket = ticket;
  const statusInfo = activeTicket ? statusLabel[activeTicket.status] : undefined;

  return (
    <div
      className={cn(
        "grid gap-6",
        activeTicket?.order ? "lg:grid-cols-[300px_minmax(0,1fr)_300px]" : "lg:grid-cols-[300px_1fr]"
      )}
    >
      <div className="flex flex-col rounded-3xl border border-border/80 bg-card/60 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Мои обращения</h2>
          <Button variant="secondary" size="sm" onClick={() => setShowNew(true)}>
            <Plus className="h-3.5 w-3.5" /> Новое
          </Button>
        </div>
        <div className="-mr-1 flex max-h-[60vh] flex-col gap-1.5 overflow-y-auto pr-1">
          {loadingList ? (
            <Loader2 className="mx-auto my-8 h-5 w-5 animate-spin text-muted-foreground" />
          ) : tickets.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Обращений пока нет</p>
          ) : (
            tickets.map((t) => (
              <button
                key={t.id}
                onClick={() => openTicket(t.id)}
                className={`rounded-2xl px-3.5 py-3 text-left transition ${
                  activeId === t.id ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-1.5 truncate text-sm font-medium">
                    {t.orderId && (
                      <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-amber-400" aria-label="Спор" />
                    )}
                    <span className="truncate">{t.subject}</span>
                  </span>
                  <Badge className={statusLabel[t.status]?.className ?? ""}>{statusLabel[t.status]?.label ?? t.status}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t._count.messages} сообщ. · {timeAgo(t.updatedAt)}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex min-h-[60vh] flex-col rounded-3xl border border-border/80 bg-card/60">
        {!activeTicket ? (
          <div className="grid flex-1 place-items-center p-10 text-center">
            <div>
              <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-primary/10">
                <Headphones className="h-8 w-8 text-primary" />
              </div>
              <p className="font-semibold">Служба поддержки</p>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                Выберите обращение слева или создайте новое — мы ответим в течение нескольких часов.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-4">
              <div className="min-w-0">
                <p className="truncate font-semibold">{activeTicket.subject}</p>
                <p className="text-xs text-muted-foreground">Создано {formatDate(activeTicket.createdAt)}</p>
              </div>
              {statusInfo && <Badge className={statusInfo.className}>{statusInfo.label}</Badge>}
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
              {loadingMessages ? (
                <Loader2 className="mx-auto my-10 h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                activeTicket.messages.map((m) => {
                  const mine = m.senderId === userId;
                  return (
                    <div key={m.id} className={`flex items-end gap-2 ${mine ? "flex-row-reverse" : ""}`}>
                      {!mine && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={activeTicket.user.avatarUrl ?? ""} />
                          <AvatarFallback className="text-[10px]">{initials("Поддержка")}</AvatarFallback>
                        </Avatar>
                      )}
                      <div className={`max-w-[75%] ${mine ? "items-end text-right" : "items-start"}`}>
                        <div
                          className={`rounded-2xl px-4 py-2.5 text-sm ${
                            mine ? "bg-primary text-primary-foreground" : "bg-muted/60 text-foreground"
                          }`}
                        >
                          {m.body}
                        </div>
                        <p className="mt-1 px-1 text-[11px] text-muted-foreground">
                          {mine ? userName : "Поддержка"} · {timeAgo(m.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              {isTyping && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Поддержка печатает…
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={sendMessage} className="flex gap-2 border-t border-border/60 p-4">
              <Input
                value={body}
                onChange={(e) => handleTyping(e.target.value)}
                placeholder="Введите сообщение…"
                disabled={activeTicket.status === "CLOSED" || sending}
              />
              <Button type="submit" disabled={!body.trim() || sending || activeTicket.status === "CLOSED"}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </>
        )}
      </div>

      {activeTicket?.order && <DealContext order={activeTicket.order} />}

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новое обращение</DialogTitle>
            <DialogDescription>Опишите проблему — мы ответим в ближайшее время.</DialogDescription>
          </DialogHeader>
          <form onSubmit={createTicket} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="t-subject">Тема</Label>
              <Input
                id="t-subject"
                placeholder="Например: не приходит товар после оплаты"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-text">Сообщение</Label>
              <Textarea
                id="t-text"
                rows={5}
                placeholder="Опишите ситуацию подробно"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={!newSubject.trim() || creating}>
              {creating && <Loader2 className="h-4 w-4 animate-spin" />}
              Создать обращение
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
