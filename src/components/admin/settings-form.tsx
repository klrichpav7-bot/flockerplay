"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPrice } from "@/lib/format";

export interface SettingsDto {
  commission: number;
  minTopUp: number;
  minWithdrawal: number;
  starsRate: number;
  starsMin: number;
  starsMax: number;
  supportEmail: string;
  telegram: string;
  vk: string;
  discord: string;
}

export function SettingsForm({ settings }: { settings: SettingsDto }) {
  const router = useRouter();
  const [form, setForm] = useState<SettingsDto>({
    commission: settings.commission,
    minTopUp: settings.minTopUp,
    minWithdrawal: settings.minWithdrawal,
    starsRate: settings.starsRate,
    starsMin: settings.starsMin,
    starsMax: settings.starsMax,
    supportEmail: settings.supportEmail,
    telegram: settings.telegram,
    vk: settings.vk,
    discord: settings.discord,
  });
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof SettingsDto>(key: K, value: SettingsDto[K]) => setForm((f) => ({ ...f, [key]: value }));

  const example = 90;
  const net = Math.round((example * (100 - (form.commission || 0))) / 100);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api("/api/admin/settings", {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      toast.success("Настройки сохранены");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6 rounded-3xl border border-border/80 bg-card/60 p-6">
      <div>
        <h2 className="font-semibold">Комиссия платформы</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Процент, который площадка удерживает с каждой продажи. Остальное получает продавец.
        </p>
        <div className="mt-3 flex max-w-xs items-center gap-2">
          <Input
            type="number"
            min={0}
            max={100}
            value={form.commission}
            onChange={(e) => set("commission", Math.round(Number(e.target.value) || 0))}
          />
          <span className="text-sm font-semibold">%</span>
        </div>
        <p className="mt-2 rounded-2xl bg-muted/40 px-4 py-2.5 text-sm text-muted-foreground">
          Пример: товар за {formatPrice(example)} → продавец на руки получает <b className="text-emerald-400">{formatPrice(net)}</b>,
          комиссия площадки — <b className="text-rose-400">{formatPrice(example - net)}</b>.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Минимальное пополнение, ₽</Label>
          <Input
            type="number"
            min={1}
            value={form.minTopUp}
            onChange={(e) => set("minTopUp", Math.round(Number(e.target.value) || 0))}
          />
        </div>
        <div className="space-y-2">
          <Label>Минимальный вывод, ₽</Label>
          <Input
            type="number"
            min={1}
            value={form.minWithdrawal}
            onChange={(e) => set("minWithdrawal", Math.round(Number(e.target.value) || 0))}
          />
        </div>
      </div>

      <div>
        <h2 className="font-semibold">ТГ-звёзды</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Курс в копейках за 1 звезду (150 = 1,50 ₽) и лимиты покупки.
        </p>
        <div className="mt-3 grid gap-5 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Курс (коп./звезда)</Label>
            <Input
              type="number"
              min={1}
              value={form.starsRate}
              onChange={(e) => set("starsRate", Math.round(Number(e.target.value) || 0))}
            />
          </div>
          <div className="space-y-2">
            <Label>Мин. покупка, звёзд</Label>
            <Input
              type="number"
              min={1}
              value={form.starsMin}
              onChange={(e) => set("starsMin", Math.round(Number(e.target.value) || 0))}
            />
          </div>
          <div className="space-y-2">
            <Label>Макс. покупка, звёзд</Label>
            <Input
              type="number"
              min={1}
              value={form.starsMax}
              onChange={(e) => set("starsMax", Math.round(Number(e.target.value) || 0))}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Email поддержки</Label>
        <Input value={form.supportEmail} onChange={(e) => set("supportEmail", e.target.value)} />
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Telegram</Label>
          <Input value={form.telegram} onChange={(e) => set("telegram", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>VK</Label>
          <Input value={form.vk} onChange={(e) => set("vk", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Discord</Label>
          <Input value={form.discord} onChange={(e) => set("discord", e.target.value)} />
        </div>
      </div>

      <Button type="submit" className="w-full sm:w-auto" disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Сохранить настройки
      </Button>
    </form>
  );
}
