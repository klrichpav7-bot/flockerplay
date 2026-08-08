"use client";

import { useEffect, useState } from "react";
import { BadgePercent, Gift, Loader2, Sparkles, TicketPercent, X } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useUserStore } from "@/store/user";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ActiveDiscount {
  code: string;
  value: number;
  expiresAt: string | null;
}

interface SuccessPayload {
  type: "BALANCE" | "DISCOUNT";
  amount: number;
  value: number;
  code: string;
}

export function PromoActivator() {
  const { update } = useSession();
  const addBalance = useUserStore((s) => s.addBalance);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState<ActiveDiscount | null>(null);
  const [success, setSuccess] = useState<SuccessPayload | null>(null);
  const [dismissing, setDismissing] = useState(false);

  useEffect(() => {
    fetch("/api/promo/current")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.discount) {
          setActive({ code: data.discount.code, value: data.discount.value, expiresAt: data.discount.expiresAt ?? null });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => {
      setDismissing(true);
      setTimeout(() => setSuccess(null), 350);
    }, 4500);
    return () => clearTimeout(t);
  }, [success]);

  const activate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return toast.error("Введите код промокода");

    setLoading(true);
    try {
      const res = await fetch("/api/promo/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Не удалось активировать промокод");

      setCode("");
      setActive(null);
      if (data.type === "BALANCE") {
        addBalance(data.value);
        setSuccess({ type: "BALANCE", amount: data.value, value: 0, code: trimmed });
      } else {
        setSuccess({ type: "DISCOUNT", amount: 0, value: data.value, code: trimmed });
      }
      update();
      toast.success("Промокод активирован!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="rounded-3xl border border-border/80 bg-card/60 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <TicketPercent className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Промокод</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Активируйте код на пополнение баланса или скидку на следующий заказ.
            </p>
          </div>
        </div>

        {active && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-violet-500/25 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 px-4 py-3">
            <div className="flex items-center gap-3">
              <BadgePercent className="h-5 w-5 text-violet-400" />
              <div>
                <p className="text-sm font-semibold">Скидка {active.value}% на следующий заказ</p>
                <p className="text-xs text-muted-foreground">
                  {active.expiresAt
                    ? `Действует до ${new Date(active.expiresAt).toLocaleDateString("ru-RU")}`
                    : "Промокод: " + active.code}
                </p>
              </div>
            </div>
            <a
              href="/cart"
              className="shrink-0 rounded-full bg-violet-500/20 px-3 py-1.5 text-xs font-medium text-violet-300 transition-colors hover:bg-violet-500/30"
            >
              В корзину
            </a>
          </div>
        )}

        <form onSubmit={activate} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Введите промокод"
            className="flex-1 uppercase tracking-wider"
            disabled={loading}
          />
          <Button type="submit" disabled={loading || !code.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gift className="h-4 w-4" />}
            Активировать
          </Button>
        </form>
      </div>

      {success && (
        <div
          className="animate-pop-in fixed bottom-8 left-1/2 z-[60] w-[min(92vw,26rem)]"
          role="status"
        >
          <div
            className={
              "relative overflow-hidden rounded-3xl border bg-card/90 p-5 shadow-2xl backdrop-blur-xl " +
              (dismissing ? "animate-fade-out " : "") +
              (success.type === "BALANCE"
                ? "border-emerald-500/40 shadow-emerald-500/20"
                : "border-violet-500/40 shadow-violet-500/20")
            }
          >
            <div
              className="animate-shine pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(115deg, transparent 30%, hsl(var(--background) / 0.6) 45%, transparent 60%)",
                backgroundSize: "250% 100%",
              }}
            />
            <button
              onClick={() => {
                setDismissing(true);
                setTimeout(() => setSuccess(null), 350);
              }}
              className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Закрыть"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-4">
              <div
                className={
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl " +
                  (success.type === "BALANCE"
                    ? "bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30"
                    : "bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30")
                }
              >
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm text-muted-foreground">Промокод {success.code} применён</p>
                {success.type === "BALANCE" ? (
                  <p className="mt-0.5 text-lg font-bold text-emerald-400">
                    Баланс пополнен на {formatPrice(success.amount)}
                  </p>
                ) : (
                  <p className="mt-0.5 text-lg font-bold text-violet-400">
                    Скидка {success.value}% на следующий заказ
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
