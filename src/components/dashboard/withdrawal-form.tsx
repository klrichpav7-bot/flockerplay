"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Banknote, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatPrice } from "@/lib/format";

const methods = [
  { value: "Банковская карта", placeholder: "Номер карты (16 цифр)", hint: "Карта Сбербанка, Тинькофф и др." },
  { value: "СБП", placeholder: "Телефон, привязанный к СБП", hint: "Перевод по номеру телефона" },
  { value: "ЮMoney", placeholder: "Номер кошелька ЮMoney", hint: "4100…" },
  { value: "Другое", placeholder: "Реквизиты для перевода", hint: "Любые удобные реквизиты" },
];

export function WithdrawalForm({
  balance,
  minWithdrawal,
}: {
  balance: number;
  minWithdrawal: number;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState(minWithdrawal);
  const [method, setMethod] = useState(methods[0].value);
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);

  const selected = methods.find((m) => m.value === method) ?? methods[0];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (amount < minWithdrawal) {
      toast.error(`Минимальная сумма вывода — ${minWithdrawal.toLocaleString("ru-RU")} ₽`);
      return;
    }
    if (amount > balance) {
      toast.error(`Недостаточно средств. Доступно: ${formatPrice(balance)}`);
      return;
    }
    if (!details.trim()) {
      toast.error("Укажите реквизиты для вывода");
      return;
    }
    setLoading(true);
    try {
      await api("/api/withdrawals", {
        method: "POST",
        body: JSON.stringify({ amount, method, details }),
      });
      toast.success("Заявка на вывод отправлена", {
        description: "Обработка займёт до 24 часов. Администратор переведёт средства вручную.",
      });
      setDetails("");
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
        <Label>Сумма вывода</Label>
        <div className="relative mt-2">
          <Banknote className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="number"
            min={minWithdrawal}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value) || 0)}
            className="pl-10"
          />
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Доступно: <b className="text-emerald-400">{formatPrice(balance)}</b> · минимум: {minWithdrawal.toLocaleString("ru-RU")} ₽
        </p>
      </div>

      <div className="space-y-2">
        <Label>Способ вывода</Label>
        <Select value={method} onValueChange={setMethod}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {methods.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">{selected.hint}</p>
      </div>

      <div className="space-y-2">
        <Label>Реквизиты получателя</Label>
        <Input
          placeholder={selected.placeholder}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">Их увидит администратор и выполнит перевод вручную.</p>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Запросить вывод
      </Button>
    </form>
  );
}
