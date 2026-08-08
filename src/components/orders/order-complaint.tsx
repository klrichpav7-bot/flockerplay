"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Flag, Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

const reasons = [
  "Товар не доставлен",
  "Товар не соответствует описанию",
  "Получены неверные данные",
  "Продавец не выходит на связь",
  "Другая проблема",
];

export function OrderComplaint({ orderId, sellerId, buyerName }: { orderId: string; sellerId: string; buyerName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(reasons[0]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (text.trim().length < 5) return toast.error("Опишите ситуацию подробнее (мин. 5 символов)");
    setSending(true);
    try {
      const d = await api<{ ticketId: string | null }>("/api/complaints", {
        method: "POST",
        body: JSON.stringify({ targetId: sellerId, orderId, reason, text: text.trim() }),
      });
      toast.success("Спор открыт. Средства заморожены до решения администрации.");
      setOpen(false);
      setText("");
      if (d.ticketId) {
        router.push(`/support?ticket=${d.ticketId}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setSending(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 py-3 text-sm font-medium text-rose-300 transition hover:border-rose-500/60 hover:bg-rose-500/20"
      >
        <Flag className="h-4 w-4" /> Сообщить о проблеме
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-3xl border border-rose-500/30 bg-rose-500/5 p-5">
      <div className="mb-3 flex items-center gap-2">
        <ShieldAlert className="h-5 w-5 text-rose-400" />
        <h3 className="text-sm font-semibold">Спор по заказу</h3>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        Спор будет передан в службу поддержки (чат с контекстом сделки), а в чат заказа добавится системное сообщение.
        Средства по заказу будут заморожены до решения.
      </p>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-muted-foreground">Причина</span>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-rose-400"
        >
          {reasons.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </label>
      <label className="mt-3 block">
        <span className="mb-1 block text-xs font-semibold text-muted-foreground">Подробности</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder={`Например: продавец не передал данные товара после оплаты.`}
          className="w-full resize-none rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-rose-400"
        />
      </label>
      <div className="mt-4 flex gap-2">
        <Button type="submit" variant="destructive" disabled={sending}>
          {sending && <Loader2 className="h-4 w-4 animate-spin" />}
          Отправить жалобу
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Отмена
        </Button>
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">
        {buyerName} увидит это сообщение. Администрация сможет вернуть вам средства.
      </p>
    </form>
  );
}
