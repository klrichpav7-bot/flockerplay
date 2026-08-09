"use client";

import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, Check, ChevronRight, Copy, Eye, EyeOff, Loader2, Star, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { VerifiedBadge } from "@/components/shared/verified-badge";
import { UserCardDialog } from "@/components/admin/user-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDate, formatPrice, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

interface AdminProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  oldPrice: number | null;
  stock: number;
  images: string[];
  deliveryType: string;
  deliveryInfo: string;
  status: "PENDING" | "APPROVED" | "HIDDEN" | "REJECTED";
  isFeatured: boolean;
  isOfficial: boolean;
  soldCount: number;
  rating: number;
  ratingCount: number;
  createdAt: string;
  category: { id: string; name: string; slug: string };
  subcategory: { id: string; name: string; slug: string } | null;
  seller: { id: string; name: string; isVerified: boolean; avatarUrl: string | null; balance: number };
  _count: { orderItems: number };
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
  const [detail, setDetail] = useState<AdminProduct | null>(null);
  const [detailIndex, setDetailIndex] = useState(0);
  const [sellerCard, setSellerCard] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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
      setDetail((prev) => (prev && prev.id === p.id ? { ...prev, ...data } : prev));
      await load(tab);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(null);
    }
  }

  function openDetail(p: AdminProduct) {
    setDetail(p);
    setDetailIndex(0);
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
              <button
                onClick={() => openDetail(p)}
                className="relative h-16 w-24 shrink-0 overflow-hidden rounded-2xl bg-muted/40 transition hover:opacity-80"
              >
                {p.images[0] ? (
                  <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="grid h-full w-full place-items-center text-xs text-muted-foreground">—</span>
                )}
                {p.isOfficial && (
                  <span className="absolute left-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-sky-500 text-white">
                    <BadgeCheck className="h-3.5 w-3.5" />
                  </span>
                )}
              </button>
              <div className="min-w-0 flex-1">
                <button
                  onClick={() => openDetail(p)}
                  className="flex flex-wrap items-center gap-2 text-left text-sm font-semibold hover:underline"
                >
                  {p.title}
                  {p.isFeatured && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
                  {p.isOfficial && (
                    <Badge className="bg-sky-500/15 text-sky-400">
                      <BadgeCheck className="h-3 w-3" /> Официально
                    </Badge>
                  )}
                </button>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {p.category.name}
                  {p.subcategory ? ` / ${p.subcategory.name}` : ""} · продавец {p.seller.name}{" "}
                  {p.seller.isVerified && <VerifiedBadge size="xs" />} · {timeAgo(p.createdAt)} · остаток {p.stock} ·{" "}
                  продано {p.soldCount}
                </p>
                <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{p.description}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">{formatPrice(p.price)}</p>
                <Badge className={statusLabel[p.status]?.className ?? ""}>{statusLabel[p.status]?.label ?? p.status}</Badge>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Button variant="secondary" size="sm" onClick={() => openDetail(p)}>
                  Подробнее <ChevronRight className="h-3.5 w-3.5" />
                </Button>
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => patch(p, { isOfficial: !p.isOfficial })}
                  disabled={busy === p.id}
                  className={cn(p.isOfficial && "border-sky-400/50 text-sky-400")}
                >
                  <BadgeCheck className="h-3.5 w-3.5" /> {p.isOfficial ? "Не официальный" : "Официально"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-3xl">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle className="flex flex-wrap items-center gap-2 pr-8">
                  {detail.title}
                  {detail.isFeatured && <Star className="h-4 w-4 fill-amber-400 text-amber-400" />}
                  {detail.isOfficial && (
                    <Badge className="bg-sky-500/15 text-sky-400">
                      <BadgeCheck className="h-3 w-3" /> Официально
                    </Badge>
                  )}
                </DialogTitle>
              </DialogHeader>

              <div className="grid max-h-[70vh] gap-5 overflow-y-auto pr-1 sm:grid-cols-[280px_1fr]">
                <div className="space-y-3">
                  <div className="aspect-square overflow-hidden rounded-2xl bg-muted/40">
                    {detail.images[detailIndex] ? (
                      <img src={detail.images[detailIndex]} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="grid h-full w-full place-items-center text-xs text-muted-foreground">Нет фото</span>
                    )}
                  </div>
                  {detail.images.length > 1 && (
                    <div className="flex gap-2">
                      {detail.images.map((img, i) => (
                        <button
                          key={i}
                          onClick={() => setDetailIndex(i)}
                          className={cn(
                            "h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted/40 ring-2 transition",
                            detailIndex === i ? "ring-primary" : "ring-transparent hover:ring-primary/40"
                          )}
                        >
                          <img src={img} alt="" className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="space-y-2 rounded-2xl border border-border/60 p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Цена</span>
                      <span className="font-bold">
                        {formatPrice(detail.price)}
                        {detail.oldPrice ? <span className="ml-1.5 text-xs font-normal text-muted-foreground line-through">{formatPrice(detail.oldPrice)}</span> : null}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Остаток</span>
                      <span>{detail.stock}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Продано</span>
                      <span>{detail.soldCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Заказов</span>
                      <span>{detail._count.orderItems}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Рейтинг</span>
                      <span>
                        {detail.rating.toFixed(1)} ({detail.ratingCount})
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Добавлен</span>
                      <span>{formatDate(detail.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Раздел</p>
                    <p className="text-sm">
                      {detail.category.name}
                      {detail.subcategory ? ` → ${detail.subcategory.name}` : ""}
                    </p>
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Описание</p>
                    <p className="whitespace-pre-wrap rounded-2xl bg-muted/40 p-3 text-sm">{detail.description}</p>
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Продавец
                    </p>
                    <div className="flex items-center justify-between gap-2 rounded-2xl bg-muted/40 p-3 text-sm">
                      <span className="flex min-w-0 items-center gap-1.5">
                        {detail.seller.avatarUrl ? (
                          <img
                            src={detail.seller.avatarUrl}
                            alt=""
                            className="h-6 w-6 shrink-0 rounded-full bg-muted object-cover"
                          />
                        ) : (
                          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-muted text-[10px] text-muted-foreground">
                            {(detail.seller.name[0] ?? "").toUpperCase()}
                          </span>
                        )}
                        <span className="truncate">
                          {detail.seller.name} {detail.seller.isVerified && <VerifiedBadge size="xs" />}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        <span className="text-muted-foreground">баланс {formatPrice(detail.seller.balance)}</span>
                        <Button variant="outline" size="sm" onClick={() => setSellerCard(detail.seller.id)}>
                          <UserRound className="h-3.5 w-3.5" /> О нём
                        </Button>
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Данные для доставки {detail.deliveryType === "AUTO" ? "(авто)" : "(ручная)"}
                    </p>
                    <div className="relative rounded-2xl border border-dashed border-border/70 bg-muted/40 p-3">
                      <pre className="whitespace-pre-wrap break-words font-mono text-xs text-emerald-400">
                        {detail.deliveryInfo || "—"}
                      </pre>
                      {detail.deliveryInfo && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="absolute right-2 top-2"
                          onClick={() => {
                            navigator.clipboard.writeText(detail.deliveryInfo).catch(() => {});
                            setCopied(true);
                            setTimeout(() => setCopied(false), 1500);
                          }}
                        >
                          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          {copied ? "Скопировано" : "Копировать"}
                        </Button>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      ID товара: <span className="font-mono">{detail.id}</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 border-t border-border/60 pt-4">
                {detail.status !== "APPROVED" && (
                  <Button size="sm" onClick={() => patch(detail, { status: "APPROVED" })} disabled={busy === detail.id}>
                    <Check className="h-3.5 w-3.5" /> Опубликовать
                  </Button>
                )}
                {detail.status !== "REJECTED" && (
                  <Button size="sm" variant="outline" onClick={() => patch(detail, { status: "REJECTED" })} disabled={busy === detail.id}>
                    <X className="h-3.5 w-3.5" /> Отклонить
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => patch(detail, { isOfficial: !detail.isOfficial })}
                  disabled={busy === detail.id}
                  className={cn(detail.isOfficial && "border-sky-400/50 text-sky-400")}
                >
                  <BadgeCheck className="h-3.5 w-3.5" /> {detail.isOfficial ? "Убрать «Официально»" : "Отметить «Официально»"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <UserCardDialog userId={sellerCard} open={!!sellerCard} onOpenChange={(o) => !o && setSellerCard(null)} />
    </div>
  );
}
