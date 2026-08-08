"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { getSocket } from "@/lib/socket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { timeAgo, initials } from "@/lib/format";

interface ChatMessage {
  id: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string | null;
  body: string;
  createdAt: string;
}

export function OrderChat({
  orderId,
  userId,
  userName,
  otherPartyName,
  otherPartyAvatar,
}: {
  orderId: string;
  userId: string;
  userName: string;
  otherPartyName: string;
  otherPartyAvatar?: string | null;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const d = await api<{ messages: ChatMessage[] }>(`/api/orders/${orderId}/messages`);
      setMessages(d.messages);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const socket = getSocket(userId);
    const onNew = (data: { orderId: string; message: ChatMessage }) => {
      if (data.orderId !== orderId) return;
      setMessages((prev) => (prev.some((m) => m.id === data.message.id) ? prev : [...prev, data.message]));
    };
    socket.on("order:new-message", onNew);
    return () => {
      socket.off("order:new-message", onNew);
    };
  }, [orderId, userId]);

  useEffect(() => {
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, loading]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || sending) return;
    setSending(true);
    try {
      const d = await api<{ message: ChatMessage }>(`/api/orders/${orderId}/messages`, {
        method: "POST",
        body: JSON.stringify({ body: body.trim() }),
      });
      setMessages((prev) => (prev.some((m) => m.id === d.message.id) ? prev : [...prev, d.message]));
      setBody("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-3xl border border-border/80 bg-card/60">
      <div className="flex items-center gap-2 border-b border-border/60 px-5 py-4">
        <MessageCircle className="h-4 w-4 text-sky-400" />
        <p className="text-sm font-semibold">Чат со сторонами сделки</p>
        <span className="ml-auto text-xs text-muted-foreground">{otherPartyName}</span>
      </div>

      <div className="max-h-[32rem] min-h-[20rem] flex-1 space-y-4 overflow-y-auto px-5 py-5">
        {loading ? (
          <Loader2 className="mx-auto my-10 h-6 w-6 animate-spin text-muted-foreground" />
        ) : messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Задайте вопрос {otherPartyName} — сообщения видны обеим сторонам сделки.
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === userId;
            return (
              <div key={m.id} className={`flex items-end gap-2 ${mine ? "flex-row-reverse" : ""}`}>
                {!mine && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={otherPartyAvatar ?? ""} />
                    <AvatarFallback className="text-[10px]">{initials(otherPartyName)}</AvatarFallback>
                  </Avatar>
                )}
                <div className={`max-w-[75%] ${mine ? "text-right" : "text-left"}`}>
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm ${
                      mine ? "bg-primary text-primary-foreground" : "bg-muted/60 text-foreground"
                    }`}
                  >
                    {m.body}
                  </div>
                  <p className="mt-1 px-1 text-[11px] text-muted-foreground">
                    {mine ? userName : otherPartyName} · {timeAgo(m.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="flex gap-2 border-t border-border/60 p-4">
        <Input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Введите сообщение…"
          disabled={sending}
        />
        <Button type="submit" disabled={!body.trim() || sending}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}
