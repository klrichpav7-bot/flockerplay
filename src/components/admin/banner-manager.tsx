"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, EyeOff, Loader2, Pencil, Plus, Trash2, Undo2, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";

interface AdminBanner {
  id: string;
  title: string;
  imageUrl: string | null;
  linkUrl: string | null;
  placement: string;
  status: "PENDING" | "ACTIVE" | "HIDDEN";
  sortOrder: number;
  durationMs: number | null;
  createdAt: string;
  owner: { id: string; name: string };
}

const statusLabel: Record<string, { label: string; className: string }> = {
  PENDING: { label: "На модерации", className: "bg-amber-500/15 text-amber-400" },
  ACTIVE: { label: "Активен", className: "bg-emerald-500/15 text-emerald-400" },
  HIDDEN: { label: "Скрыт", className: "bg-muted text-muted-foreground" },
};

const placementLabel: Record<string, string> = {
  HOME: "Главная",
  CATALOG: "Каталог",
  SIDEBAR: "Сайдбар",
  TOP: "Верхний баннер",
};

const emptyForm = {
  title: "",
  imageUrl: "",
  linkUrl: "",
  placement: "HOME",
  status: "ACTIVE",
  sortOrder: 0,
  durationMs: 5000,
};

export function BannerManager() {
  const [items, setItems] = useState<AdminBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminBanner | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    try {
      const d = await api<{ banners: AdminBanner[] }>("/api/admin/banners");
      setItems(d.banners);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function patch(b: AdminBanner, status: string) {
    setBusy(b.id);
    try {
      await api(`/api/admin/banners/${b.id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(null);
    }
  }

  async function remove(b: AdminBanner) {
    if (!confirm(`Удалить баннер «${b.title}»?`)) return;
    setBusy(b.id);
    try {
      await api(`/api/admin/banners/${b.id}`, { method: "DELETE" });
      toast.success("Баннер удалён");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(null);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api(`/api/admin/banners/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(form),
        });
        toast.success("Баннер обновлён");
      } else {
        await api("/api/admin/banners", { method: "POST", body: JSON.stringify(form) });
        toast.success("Баннер создан");
      }
      setEditing(null);
      setCreating(false);
      setForm(emptyForm);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(b: AdminBanner) {
    setEditing(b);
    setCreating(true);
    setForm({
      title: b.title,
      imageUrl: b.imageUrl ?? "",
      linkUrl: b.linkUrl ?? "",
      placement: b.placement,
      status: b.status,
      sortOrder: b.sortOrder,
      durationMs: b.durationMs ?? 5000,
    });
  }

  const formEl = (creating || editing) && (
    <form onSubmit={save} className="rounded-3xl border border-border/80 bg-card/60 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">{editing ? "Редактирование баннера" : "Новый баннер"}</h3>
        <button
          type="button"
          onClick={() => {
            setCreating(false);
            setEditing(null);
            setForm(emptyForm);
          }}
          className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-muted-foreground">Заголовок</span>
          <input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-muted-foreground">Ссылка</span>
          <input
            value={form.linkUrl}
            onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
            placeholder="/catalog"
            className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-muted-foreground">URL изображения</span>
          <input
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            placeholder="https://..."
            className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </label>
        <div className="grid grid-cols-3 gap-2">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted-foreground">Размещение</span>
            <select
              value={form.placement}
              onChange={(e) => setForm({ ...form, placement: e.target.value })}
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="HOME">Главная</option>
              <option value="CATALOG">Каталог</option>
              <option value="SIDEBAR">Сайдбар</option>
              <option value="TOP">Верхний баннер</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted-foreground">Слайд, мс</span>
            <input
              type="number"
              min={1000}
              max={60000}
              value={form.durationMs}
              onChange={(e) => setForm({ ...form, durationMs: Number(e.target.value) })}
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted-foreground">Порядок</span>
            <input
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </label>
        </div>
        {editing && (
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-semibold text-muted-foreground">Статус</span>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="ACTIVE">Активен</option>
              <option value="PENDING">На модерации</option>
              <option value="HIDDEN">Скрыт</option>
            </select>
          </label>
        )}
      </div>
      <div className="mt-4 flex gap-2">
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {editing ? "Сохранить" : "Создать"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setCreating(false);
            setEditing(null);
            setForm(emptyForm);
          }}
        >
          Отмена
        </Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-4">
      {!creating && (
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> Добавить баннер
        </Button>
      )}
      {formEl}
      <div className="space-y-3">
        {loading ? (
          <Loader2 className="mx-auto my-14 h-6 w-6 animate-spin text-muted-foreground" />
        ) : items.length === 0 ? (
          <p className="rounded-3xl border border-border/80 bg-card/60 py-14 text-center text-sm text-muted-foreground">
            Баннеров нет
          </p>
        ) : (
          items.map((b) => (
            <div key={b.id} className="overflow-hidden rounded-3xl border border-border/80 bg-card/60">
              {b.imageUrl && <img src={b.imageUrl} alt={b.title} className="h-32 w-full object-cover" />}
              <div className="flex flex-wrap items-center gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{b.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {b.owner.name} · {placementLabel[b.placement] ?? b.placement} · {formatDate(b.createdAt)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {b.durationMs ?? 5000} мс · порядок {b.sortOrder}
                    {b.linkUrl ? ` · ${b.linkUrl}` : ""}
                  </p>
                </div>
                <Badge className={statusLabel[b.status]?.className ?? ""}>{statusLabel[b.status]?.label ?? b.status}</Badge>
                <div className="flex flex-wrap gap-1.5">
                  {b.status !== "ACTIVE" && (
                    <Button variant="secondary" size="sm" onClick={() => patch(b, "ACTIVE")} disabled={busy === b.id}>
                      <Check className="h-3.5 w-3.5" /> Активировать
                    </Button>
                  )}
                  {b.status !== "HIDDEN" && (
                    <Button variant="outline" size="sm" onClick={() => patch(b, "HIDDEN")} disabled={busy === b.id}>
                      <EyeOff className="h-3.5 w-3.5" /> Скрыть
                    </Button>
                  )}
                  {b.status !== "PENDING" && (
                    <Button variant="ghost" size="sm" onClick={() => patch(b, "PENDING")} disabled={busy === b.id}>
                      <Undo2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => startEdit(b)} disabled={busy === b.id}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(b)} disabled={busy === b.id}>
                    <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
