"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, CreditCard, Smartphone, Sparkles, Star, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const DENOMINATIONS = [50, 75, 100, 150, 250, 500, 1000];

type StarsData = {
  rate: number;
  pricePerStar: number;
  min: number;
  max: number;
  product: { id: string; title: string; sellerId: string; deliveryType: string; deliveryInfo: string } | null;
  balance: number;
};

export function StarsBuy({ initial }: { initial: StarsData }) {
  const router = useRouter();
  const [amount, setAmount] = useState<number>(initial.min);
  const [method, setMethod] = useState<"balance" | "yoomoney">("balance");
  const [telegram, setTelegram] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<StarsData>(initial);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/stars");
    if (res.ok) setData((await res.json()) as StarsData);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const priceRubles = useMemo(
    () => (amount * data.pricePerStar * 100) / 100,
    [amount, data.pricePerStar]
  );

  const canAffordBalance = data.balance >= Math.round(amount * data.pricePerStar * 100);

  async function buy() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, method, telegram }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body?.error ?? "Не удалось оформить покупку");
        return;
      }
      if (body.confirmationUrl) {
        window.location.href = body.confirmationUrl;
        return;
      }
      if (body.orderId) {
        router.push(`/orders/${body.orderId}`);
        return;
      }
    } catch {
      setError("Ошибка сети. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="glass-card p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-lg shadow-blue-500/30">
            <Star className="h-6 w-6" />
          </span>
          <div>
            <h2 className="font-display text-xl font-bold">ТГ-звёзды</h2>
            <p className="text-sm text-muted-foreground">
              1 звезда = {data.pricePerStar.toLocaleString("ru-RU", { minimumFractionDigits: 2 })} ₽
            </p>
          </div>
        </div>

        <p className="mb-3 text-sm font-semibold text-muted-foreground">Количество звёзд</p>
        <div className="grid grid-cols-4 gap-2">
          {DENOMINATIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setAmount(d)}
              className={cn(
                "rounded-xl border px-2 py-2.5 text-sm font-semibold transition",
                amount === d
                  ? "border-sky-400 bg-sky-500/15 text-sky-300"
                  : "border-border bg-card/60 hover:border-sky-400/40"
              )}
            >
              {d}
            </button>
          ))}
        </div>

        <label className="mt-4 block">
          <span className="mb-1.5 block text-sm font-semibold text-muted-foreground">Своё количество</span>
          <input
            type="number"
            min={data.min}
            max={data.max}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full rounded-xl border border-border bg-card/60 px-4 py-2.5 outline-none transition focus:border-sky-400"
          />
          <span className="mt-1 block text-xs text-muted-foreground">
            От {data.min.toLocaleString("ru-RU")} до {data.max.toLocaleString("ru-RU")} звёзд за покупку
          </span>
        </label>

        <label className="mt-4 block">
          <span className="mb-1.5 block text-sm font-semibold text-muted-foreground">
            Ваш Telegram-аккаунт <span className="font-normal">(для доставки)</span>
          </span>
          <input
            type="text"
            value={telegram}
            onChange={(e) => setTelegram(e.target.value)}
            placeholder="@username"
            className="w-full rounded-xl border border-border bg-card/60 px-4 py-2.5 outline-none transition focus:border-sky-400"
          />
        </label>

        <p className="mt-5 text-sm font-semibold text-muted-foreground">Способ оплаты</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => setMethod("balance")}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-sm font-semibold transition",
              method === "balance" ? "border-sky-400 bg-sky-500/15 text-sky-300" : "border-border bg-card/60 hover:border-sky-400/40"
            )}
          >
            <Wallet className="h-5 w-5" />
            Баланс
            <span className="text-xs font-normal text-muted-foreground">
              {(data.balance / 100).toLocaleString("ru-RU")} ₽
            </span>
          </button>
          <button
            type="button"
            onClick={() => setMethod("yoomoney")}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-sm font-semibold transition",
              method === "yoomoney" ? "border-sky-400 bg-sky-500/15 text-sky-300" : "border-border bg-card/60 hover:border-sky-400/40"
            )}
          >
            <CreditCard className="h-5 w-5" />
            Картой
            <span className="text-xs font-normal text-muted-foreground">ЮMoney / СБП</span>
          </button>
          <button
            type="button"
            onClick={() => setMethod("yoomoney")}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-sm font-semibold transition",
              method === "yoomoney" ? "border-sky-400 bg-sky-500/15 text-sky-300" : "border-border bg-card/60 hover:border-sky-400/40"
            )}
          >
            <Smartphone className="h-5 w-5" />
            СБП
            <span className="text-xs font-normal text-muted-foreground">Мир/СБП</span>
          </button>
        </div>

        {error && (
          <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">{error}</p>
        )}

        <button
          type="button"
          onClick={buy}
          disabled={loading}
          className="btn-primary-gradient mt-6 w-full rounded-full px-6 py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? "Оформляем..."
            : `Купить ${amount.toLocaleString("ru-RU")} звёзд за ${priceRubles.toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ₽`}
        </button>
        {method === "balance" && !canAffordBalance && (
          <p className="mt-2 text-center text-xs text-red-300">
            Недостаточно средств на балансе. Выберите оплату картой или пополните баланс.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div className="glass-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <BadgeCheck className="h-5 w-5 text-sky-400" />
            <h3 className="font-display text-lg font-bold">Официально от Flocker Play</h3>
          </div>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            {[
              "Официальные звёзды Telegram по фиксированному курсу",
              "Мгновенная доставка проверенным продавцом после оплаты",
              "Сделки под защитой: деньги возвращаются, если товар не пришёл",
              "Работает для каналов, групп и личных сообщений",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-border/70 bg-card/50 p-6">
          <p className="text-sm text-muted-foreground">Пример расчёта</p>
          <div className="mt-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span>100 звёзд</span>
              <span className="font-semibold">{(100 * data.pricePerStar).toLocaleString("ru-RU")} ₽</span>
            </div>
            <div className="flex justify-between">
              <span>1000 звёзд</span>
              <span className="font-semibold">{(1000 * data.pricePerStar).toLocaleString("ru-RU")} ₽</span>
            </div>
            <div className="flex justify-between">
              <span>10 000 звёзд</span>
              <span className="font-semibold">{(10000 * data.pricePerStar).toLocaleString("ru-RU")} ₽</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
