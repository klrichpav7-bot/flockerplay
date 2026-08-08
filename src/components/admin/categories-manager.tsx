"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Star, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { AppIcon } from "@/components/shared/app-icon";
import { ImagePicker } from "@/components/shared/image-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  accent: string | null;
  sortOrder: number;
  active: boolean;
  featured: boolean;
  _count: { products: number; subcategories: number };
}

const emptyForm = {
  name: "",
  slug: "",
  icon: "",
  accent: "",
  sortOrder: 0,
  active: true,
  featured: false,
};

export function CategoriesManager() {
  const [items, setItems] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    try {
      const d = await api<{ categories: AdminCategory[] }>("/api/admin/categories");
      setItems(d.categories);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api(`/api/admin/categories/${editing.id}`, { method: "PATCH", body: JSON.stringify(form) });
        toast.success("Категория обновлена");
      } else {
        await api("/api/admin/categories", { method: "POST", body: JSON.stringify(form) });
        toast.success("Категория создана");
      }
      reset();
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setSaving(false);
    }
  }

  async function remove(c: AdminCategory) {
    if (!confirm(`Удалить категорию «${c.name}»?`)) return;
    setBusy(c.id);
    try {
      await api(`/api/admin/categories/${c.id}`, { method: "DELETE" });
      toast.success("Категория удалена");
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

  function startEdit(c: AdminCategory) {
    setEditing(c);
    setCreating(true);
    setForm({
      name: c.name,
      slug: c.slug,
      icon: c.icon ?? "",
      accent: c.accent ?? "",
      sortOrder: c.sortOrder,
      active: c.active,
      featured: c.featured,
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setCreating((v) => !v)}>
          <Plus className="h-4 w-4" /> Добавить категорию
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
            <h3 className="font-semibold">{editing ? "Редактирование категории" : "Новая категория"}</h3>
            <button type="button" onClick={reset} className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-muted-foreground">Название</span>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-muted-foreground">Slug</span>
              <input
                required
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
                placeholder="telegram"
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-muted-foreground">
                Иконка (эмодзи, ключ или изображение)
              </span>
              <input
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                placeholder="✈️, key или /uploads/…"
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <span className="mt-2 block">
                <ImagePicker value={form.icon} onChange={(icon) => setForm({ ...form, icon })} />
              </span>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-muted-foreground">Цвет-акцент (hex)</span>
              <input
                value={form.accent}
                onChange={(e) => setForm({ ...form, accent: e.target.value })}
                placeholder="#229ED9"
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
            <div className="flex items-end gap-4 pb-1">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="h-4 w-4 accent-primary"
                />
                Активна
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                  className="h-4 w-4 accent-primary"
                />
                Избранная
              </label>
            </div>
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
        <p className="rounded-3xl border border-border/80 bg-card/60 py-14 text-center text-sm text-muted-foreground">Категорий нет</p>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border/80 bg-card/60">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border/70 text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3">Раздел</th>
                <th className="px-5 py-3">Slug</th>
                <th className="px-5 py-3">Товары</th>
                <th className="px-5 py-3">Подразделы</th>
                <th className="px-5 py-3">Статус</th>
                <th className="px-5 py-3 text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id} className={cn("border-b border-border/50 last:border-0", !c.active && "opacity-50")}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-xl bg-muted/60">
                        <AppIcon icon={c.icon} className="h-4 w-4" textClassName="text-lg" />
                      </span>
                      <div>
                        <p className="flex items-center gap-1.5 font-semibold">
                          {c.name}
                          {c.featured && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
                        </p>
                        {c.accent && <p className="text-[11px] text-muted-foreground">#{c.accent.replace("#", "")}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{c.slug}</td>
                  <td className="px-5 py-3">{c._count.products}</td>
                  <td className="px-5 py-3">{c._count.subcategories}</td>
                  <td className="px-5 py-3">
                    <Badge className={c.active ? "bg-emerald-500/15 text-emerald-400" : "bg-muted text-muted-foreground"}>
                      {c.active ? "Активна" : "Скрыта"}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => startEdit(c)} disabled={busy === c.id}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => remove(c)} disabled={busy === c.id}>
                        <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
