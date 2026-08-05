"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Eye, EyeOff, Loader2, Star, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { VerifiedBadge } from "@/components/shared/verified-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

interface AdminProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  oldPrice: number | null;
  stock: number;
  images: string[];
  status: "PENDING" | "APPROVED" | "HIDDEN" | "REJECTED";
  isFeatured: boolean;
  soldCount: number;
  createdAt: string;
  category: { name: string };
  seller: { id: string; name: string; isVerified: boolean };
}

const tabs = [
  { value: "ALL", label: "Все" },
  { value: "PENDING", label: "На модерации" },
  { value: "APPROVED", label: "Опубликовано" },
  { value: "HIDDEN", label: "Скрытые" },
  { value: "REJECTED", label: "Отклонённые" },
];

const statusLabel: Record<string, { label: string; className: string }> = {
  PENDING: { label: "На модерации", className: "bg-amber-500/15 text-amber-400" },
  APPROVED: { label: "Опубликовано", className: "bg-emerald-500/15 text-emerald-400" },
  HIDDEN: { label: "Скрыт", className: "bg-muted text-muted-foreground" },
  REJECTED: { label: "Отклонён", className: "bg-rose-500/15 text-rose-400" },
};

export function ProductsList() {
  const [tab, setTab] = useState("PENDING");
  const [items, setItems] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async (status: string) => {
    setLoading(true);
    try {
      const d = await api<{ products: AdminProduct[] }>(`/api/admin/products?status=${status}`);
      setItems(d.products);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(tab);
  }, [tab, load]);

  async function patch(p: AdminProduct, data: Record<string, unknown>) {
    setBusy(p.id);
    try {
      await api(`/api/admin/products/${p.id}`, { method: "PATCH", body: JSON.stringify(data) });
      toast.success("Сохранено");
      await load(tab);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Button
            key={t.value}
            variant={tab === t.value ? "default" : "secondary"}
            size="sm"
            onClick={() => setTab(t.value)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <Loader2 className="mx-auto my-14 h-6 w-6 animate-spin text-muted-foreground" />
      ) : items.length === 0 ? (
        <p className="rounded-3xl border border-border/80 bg-card/60 py-14 text-center text-sm text-muted-foreground">
          Товаров в этой категории нет
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center gap-4 rounded-3xl border border-border/80 bg-card/60 p-4">
              <div className="h-16 w-24 shrink-0 overflow-hidden rounded-2xl bg-muted/40">
                {p.images[0] ? (
                  <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="grid h-full w-full place-items-center text-xs text-muted-foreground">—</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                  {p.title}
                  {p.isFeatured && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {p.category.name} · продавец {p.seller.name} {p.seller.isVerified && <VerifiedBadge size="xs" />} ·{" "}
                  {timeAgo(p.createdAt)} · остаток {p.stock}
                </p>
                <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{p.description}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">{formatPrice(p.price)}</p>
                <Badge className={statusLabel[p.status]?.className ?? ""}>{statusLabel[p.status]?.label ?? p.status}</Badge>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {p.status !== "APPROVED" && (
                  <Button variant="secondary" size="sm" onClick={() => patch(p, { status: "APPROVED" })} disabled={busy === p.id}>
                    <Check className="h-3.5 w-3.5" /> Опубликовать
                  </Button>
                )}
                {p.status !== "REJECTED" && (
                  <Button variant="outline" size="sm" onClick={() => patch(p, { status: "REJECTED" })} disabled={busy === p.id}>
                    <X className="h-3.5 w-3.5" /> Отклонить
                  </Button>
                )}
                {p.status !== "HIDDEN" ? (
                  <Button variant="outline" size="sm" onClick={() => patch(p, { status: "HIDDEN" })} disabled={busy === p.id}>
                    <EyeOff className="h-3.5 w-3.5" /> Скрыть
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => patch(p, { status: "APPROVED" })} disabled={busy === p.id}>
                    <Eye className="h-3.5 w-3.5" /> Показать
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => patch(p, { isFeatured: !p.isFeatured })}
                  disabled={busy === p.id}
                  className={cn(p.isFeatured && "border-amber-400/50 text-amber-400")}
                >
                  <Star className="h-3.5 w-3.5" /> {p.isFeatured ? "Убрать из топа" : "В топ"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
