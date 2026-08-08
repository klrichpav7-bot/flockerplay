"use client";

import { useCallback, useEffect, useState } from "react";
import { BadgePercent, Coins, Loader2, Pencil, Plus, Ticket, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";

interface AdminPromo {
  id: string;
  code: string;
  type: "BALANCE" | "DISCOUNT";
  value: number;
  maxUses: number;
  uses: number;
  startsAt: string | null;
  expiresAt: string | null;
  active: boolean;
  createdAt: string;
  _count: { redemptions: number };
}

const emptyForm = {
  code: "",
  type: "BALANCE" as "BALANCE" | "DISCOUNT",
  value: 100,
  maxUses: 0,
  startsAt: "",
  expiresAt: "",
  active: true,
};

export function PromoManager() {
  const [items, setItems] = useState<AdminPromo[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminPromo | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    try {
      const d = await api<{ promos: AdminPromo[] }>("/api/admin/promos");
      setItems(d.promos);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function toForm(p: AdminPromo) {
    return {
      code: p.code,
      type: p.type,
      value: p.value,
      maxUses: p.maxUses,
      startsAt: p.startsAt ? toLocalInput(p.startsAt) : "",
      expiresAt: p.expiresAt ? toLocalInput(p.expiresAt) : "",
      active: p.active,
    };
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (form.type === "DISCOUNT" && form.value > 90) {
      toast.error("Скидка не может превышать 90%");
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
    };
    try {
      if (editing) {
        await api(`/api/admin/promos/${editing.id}`, { method: "PATCH", body: JSON.stringify(payload) });
        toast.success("Промокод обновлён");
      } else {
        await api("/api/admin/promos", { method: "POST", body: JSON.stringify(payload) });
        toast.success("Промокод создан");
      }
      reset();
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setSaving(false);
    }
  }

  async function remove(p: AdminPromo) {
    if (!confirm(`Удалить промокод «${p.code}»?`)) return;
    setBusy(p.id);
    try {
      await api(`/api/admin/promos/${p.id}`, { method: "DELETE" });
      toast.success("Промокод удалён");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(null);
    }
  }

  async function toggleActive(p: AdminPromo) {
    setBusy(p.id);
    try {
      await api(`/api/admin/promos/${p.id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: !p.active }),
      });
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(null);
    }
  }

  function reset() {
    setCreating(false);
    setEditing(null);
    setForm(emptyForm);
  }

  const expired = (p: AdminPromo) => Boolean(p.expiresAt && new Date(p.expiresAt) < new Date());

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setCreating((v) => !v)}>
          <Plus className="h-4 w-4" /> Создать промокод
        </Button>
        {creating && (
          <Button variant="ghost" onClick={reset}>
            <X className="h-4 w-4" /> Отмена
          </Button>
        )}
      </div>

      {creating && (
        <form onSubmit={save} className="rounded-3xl border border-border/80 bg-card/60 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">{editing ? "Редактирование промокода" : "Новый промокод"}</h3>
            <button type="button" onClick={reset} className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-muted-foreground">Код промокода</span>
              <input
                required
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s/g, "") })}
                placeholder="WELCOME50"
                className="w-full rounded-xl border border-border bg-card px-3 py-2 font-mono text-sm uppercase outline-none focus:border-primary"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-muted-foreground">Тип бонуса</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: "BALANCE" })}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition",
                    form.type === "BALANCE"
                      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Coins className="h-4 w-4" /> Баланс
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: "DISCOUNT" })}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition",
                    form.type === "DISCOUNT"
                      ? "border-sky-500/50 bg-sky-500/10 text-sky-400"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  )}
                >
                  <BadgePercent className="h-4 w-4" /> Скидка
                </button>
              </div>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-muted-foreground">
                {form.type === "BALANCE" ? "Сумма начисления (₽)" : "Размер скидки (%)"}
              </span>
              <input
                required
                type="number"
                min={1}
                max={form.type === "DISCOUNT" ? 90 : 100000}
                value={form.value}
                onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
              />
              {form.type === "DISCOUNT" && (
                <span className="mt-1 block text-[11px] text-muted-foreground">Скидка применяется при следующем заказе</span>
              )}
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-muted-foreground">Лимит активаций (0 — без лимита)</span>
              <input
                type="number"
                min={0}
                value={form.maxUses}
                onChange={(e) => setForm({ ...form, maxUses: Number(e.target.value) })}
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-muted-foreground">Начало действия (необязательно)</span>
              <input
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-muted-foreground">Срок действия (необязательно)</span>
              <input
                type="datetime-local"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </label>

            <label className="flex items-center gap-2 text-sm sm:items-end sm:pb-1">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="h-4 w-4 accent-primary"
              />
              Активен сразу
            </label>
          </div>

          <div className="mt-4 flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Сохранить" : "Создать"}
            </Button>
            <Button type="button" variant="ghost" onClick={reset}>
              Отмена
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <Loader2 className="mx-auto my-14 h-6 w-6 animate-spin text-muted-foreground" />
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-border/80 bg-card/60 p-10 text-center">
          <Ticket className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 font-semibold">Промокодов пока нет</p>
          <p className="mt-1 text-sm text-muted-foreground">Создайте первый промокод — пользователи смогут активировать его в личном кабинете.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border/80 bg-card/60">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border/70 text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3">Код</th>
                <th className="px-5 py-3">Бонус</th>
                <th className="px-5 py-3">Активации</th>
                <th className="px-5 py-3">Срок</th>
                <th className="px-5 py-3">Статус</th>
                <th className="px-5 py-3 text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => {
                const isExpired = expired(p);
                return (
                  <tr key={p.id} className={cn("border-b border-border/50 last:border-0", (!p.active || isExpired) && "opacity-55")}>
                    <td className="px-5 py-3">
                      <p className="font-mono text-sm font-semibold tracking-wider">{p.code}</p>
                      <p className="text-[11px] text-muted-foreground">Создан {formatDate(p.createdAt)}</p>
                    </td>
                    <td className="px-5 py-3">
                      <Badge className={p.type === "BALANCE" ? "bg-emerald-500/15 text-emerald-400" : "bg-sky-500/15 text-sky-400"}>
                        {p.type === "BALANCE" ? `+${p.value.toLocaleString("ru-RU")} ₽` : `${p.value}% скидка`}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-semibold">{p.uses}</span>
                      <span className="text-muted-foreground">{p.maxUses > 0 ? ` / ${p.maxUses}` : " / ∞"}</span>
                      <span className="block text-[11px] text-muted-foreground">{p._count.redemptions} активаций</span>
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {isExpired ? (
                        <span className="text-rose-400">Истёк {formatDate(p.expiresAt!)}</span>
                      ) : p.expiresAt ? (
                        <>до {formatDate(p.expiresAt)}</>
                      ) : (
                        "Без срока"
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={() => toggleActive(p)} disabled={busy === p.id} className="cursor-pointer">
                        <Badge className={p.active ? "bg-emerald-500/15 text-emerald-400" : "bg-muted text-muted-foreground"}>
                          {p.active ? "Активен" : "Отключён"}
                        </Badge>
                      </button>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditing(p);
                            setCreating(true);
                            setForm(toForm(p));
                          }}
                          disabled={busy === p.id}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => remove(p)} disabled={busy === p.id}>
                          <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
