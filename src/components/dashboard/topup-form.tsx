"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { ImageUploader } from "@/components/shared/image-uploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const quickAmounts = [100, 250, 500, 1000, 2500, 5000];

export function TopUpForm() {
  const router = useRouter();
  const [amount, setAmount] = useState(500);
  const [method, setMethod] = useState("");
  const [comment, setComment] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!method.trim()) {
      toast.error("Укажите способ пополнения");
      return;
    }
    setLoading(true);
    try {
      await api("/api/topups", {
        method: "POST",
        body: JSON.stringify({ amount, method, comment, proofUrl }),
      });
      toast.success("Заявка на пополнение отправлена", {
        description: "Администратор проверит её в ближайшее время.",
      });
      setMethod("");
      setComment("");
      setProofUrl("");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5 rounded-3xl border border-border/80 bg-card/60 p-6">
      <div>
        <Label>Сумма пополнения</Label>
        <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {quickAmounts.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAmount(a)}
              className={
                "rounded-xl border py-2 text-sm font-semibold transition " +
                (amount === a
                  ? "border-primary/60 bg-primary/15 text-primary"
                  : "border-border bg-card/60 text-foreground/70 hover:border-primary/40")
              }
            >
              {a}
            </button>
          ))}
        </div>
        <div className="relative mt-3">
          <Wallet className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value) || 0)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="method">Способ пополнения</Label>
        <Input
          id="method"
          placeholder="Например: СБП, карта, USDT…"
          value={method}
          onChange={(e) => setMethod(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Реквизиты для перевода уточняйте в поддержке после отправки заявки.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="comment">Комментарий</Label>
        <Textarea
          id="comment"
          rows={3}
          placeholder="Откуда перевод, номер транзакции…"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Скриншот перевода (необязательно)</Label>
        <ImageUploader value={proofUrl} onChange={setProofUrl} label="Загрузить скриншот" />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Отправить заявку
      </Button>
    </form>
  );
}
