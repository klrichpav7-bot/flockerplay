"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { useUserStore } from "@/store/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const quickAmounts = [100, 250, 500, 1000, 2500, 5000];

export function YooMoneyCard({
  minTopUp,
  pendingPaymentId,
}: {
  minTopUp: number;
  pendingPaymentId?: string | null;
}) {
  const router = useRouter();
  const setBalance = useUserStore((s) => s.setBalance);
  const [amount, setAmount] = useState(500);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "waiting" | "succeeded" | "failed">("idle");
  const pendingId = useRef(pendingPaymentId ?? null);

  const poll = useCallback(async (paymentId: string) => {
    let attempts = 0;
    const tick = async (): Promise<void> => {
      if (attempts > 40) return;
      attempts += 1;
      try {
        const d = await api<{ status: string; newBalance: number }>(
          `/api/payments/yoomoney/status?paymentId=${paymentId}`
        );
        if (d.status === "SUCCEEDED") {
          setStatus("succeeded");
          setBalance(d.newBalance);
          toast.success("Оплата прошла, баланс пополнен");
          router.refresh();
          return;
        }
        if (d.status === "CANCELED" || d.status === "FAILED") {
          setStatus("failed");
          toast.error("Платёж не был завершён");
          router.refresh();
          return;
        }
      } catch {
        /* таймаут ожидания */
      }
      setTimeout(tick, 2500);
    };
    void tick();
  }, [router, setBalance]);

  useEffect(() => {
    if (pendingId.current) {
      setStatus("waiting");
      poll(pendingId.current);
    }
  }, [poll]);

  async function pay() {
    if (amount < minTopUp) {
      toast.error(`Минимальная сумма пополнения — ${minTopUp} ₽`);
      return;
    }
    setLoading(true);
    try {
      const d = await api<{ paymentId: string; confirmationUrl: string }>("/api/payments/yoomoney/create", {
        method: "POST",
        body: JSON.stringify({ amount }),
      });
      pendingId.current = d.paymentId;
      window.location.href = d.confirmationUrl;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5 rounded-3xl border border-primary/25 bg-gradient-to-br from-sky-600/10 to-violet-600/10 p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-semibold">
            <CreditCard className="h-4 w-4 text-sky-400" /> Оплата через ЮMoney
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Платежи принимаются на кошелёк ЮMoney администратора. После перевода средства зачисляются на баланс вручную — обычно в течение нескольких минут.
          </p>
        </div>
      </div>

      <div>
        <Label>Сумма</Label>
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
            min={minTopUp}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value) || 0)}
            className="pl-10"
          />
        </div>
      </div>

      {status === "waiting" && (
        <p className="flex items-center gap-2 rounded-2xl bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Оплата отправлена — средства зачислятся после проверки администратором…
        </p>
      )}
      {status === "succeeded" && (
        <p className="rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          Платёж подтверждён, баланс пополнен.
        </p>
      )}
      {status === "failed" && (
        <p className="rounded-2xl bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
          Платёж не был завершён. Попробуйте ещё раз.
        </p>
      )}

      <Button type="button" onClick={pay} className="w-full" disabled={loading || status === "waiting"}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Оплатить через ЮMoney
      </Button>
    </div>
  );
}
