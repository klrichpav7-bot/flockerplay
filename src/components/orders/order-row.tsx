"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCheck, ClipboardCopy, Loader2, Send, Star } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { formatDate, formatPrice, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface OrderDto {
  id: string;
  status: string;
  total: number;
  qty: number;
  sellerAmount: number;
  fundsReleaseAt?: string | null;
  buyerNote?: string | null;
  deliveryInfo?: string | null;
  createdAt: string;
  product?: { id: string; title: string; images: string[]; deliveryType: string } | null;
  buyer?: { id: string; name: string; isVerified: boolean } | null;
  seller?: { id: string; name: string; isVerified: boolean } | null;
  review?: { rating: number; comment?: string | null } | null;
}

const statusMap: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Ожидает оплаты", className: "bg-amber-500/15 text-amber-400" },
  PAID: { label: "Оплачен · ожидает выдачи", className: "bg-sky-500/15 text-sky-400" },
  DELIVERED: { label: "Доставлен", className: "bg-violet-500/15 text-violet-400" },
  COMPLETED: { label: "Завершён", className: "bg-emerald-500/15 text-emerald-400" },
  CANCELLED: { label: "Отменён", className: "bg-rose-500/15 text-rose-400" },
};

export function OrderRow({ order, role }: { order: OrderDto; role: "buyer" | "seller" }) {
  const router = useRouter();
  const [delivering, setDelivering] = useState(false);
  const [deliveryText, setDeliveryText] = useState("");
  const [copied, setCopied] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const st = statusMap[order.status] ?? { label: order.status, className: "" };

  async function deliver() {
    if (!deliveryText.trim()) {
      toast.error("Введите данные для выдачи");
      return;
    }
    setDelivering(true);
    try {
      await api(`/api/orders/${order.id}/deliver`, { method: "POST", body: JSON.stringify({ deliveryInfo: deliveryText }) });
      toast.success("Товар отгружен покупателю");
      setDeliveryText("");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setDelivering(false);
    }
  }

  async function confirm() {
    if (submitting) return;
    setSubmitting(true);
    try {
      await api(`/api/orders/${order.id}/complete`, {
        method: "POST",
        body: JSON.stringify({ rating, comment }),
      });
      toast.success("Заказ завершён, спасибо за отзыв!");
      setReviewOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setSubmitting(false);
    }
  }

  async function copyInfo() {
    if (!order.deliveryInfo) return;
    await navigator.clipboard.writeText(order.deliveryInfo);
    setCopied(true);
    toast.success("Скопировано");
    setTimeout(() => setCopied(false), 1500);
  }

  const image = order.product?.images?.[0];

  return (
    <div className="rounded-3xl border border-border/80 bg-card/60 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-4">
          <Link href={order.product ? `/product/${order.product.id}` : "#"} className="shrink-0 overflow-hidden rounded-2xl">
            {image ? (
              <img src={image} alt="" className="h-16 w-16 object-cover" />
            ) : (
              <span className="grid h-16 w-16 place-items-center bg-muted/40 text-xs text-muted-foreground">—</span>
            )}
          </Link>
          <div className="min-w-0">
            <Link
              href={order.product ? `/product/${order.product.id}` : "#"}
              className="line-clamp-1 text-sm font-semibold transition hover:text-sky-400"
            >
              {order.product?.title ?? "Товар"}
            </Link>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {role === "buyer" ? `Продавец: ${order.seller?.name ?? "—"}` : `Покупатель: ${order.buyer?.name ?? "—"}`}
              {" · "}
              {formatDate(order.createdAt)}
            </p>
            <p className="mt-0.5 text-sm font-bold text-emerald-400">
              {formatPrice(order.total)} ×{order.qty}
            </p>
          </div>
        </div>
        <Badge className={st.className}>{st.label}</Badge>
      </div>

      {order.buyerNote && (
        <p className="mt-3 rounded-2xl bg-muted/40 px-4 py-2.5 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Комментарий покупателя:</span> {order.buyerNote}
        </p>
      )}

      {order.status === "DELIVERED" && order.deliveryInfo && (
        <div className="mt-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-4">
          <p className="mb-2 flex items-center justify-between gap-2 text-xs font-semibold text-emerald-400">
            Данные для получения
            <button onClick={copyInfo} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-emerald-400 transition hover:bg-emerald-500/10">
              {copied ? <CheckCheck className="h-3.5 w-3.5" /> : <ClipboardCopy className="h-3.5 w-3.5" />}
              {copied ? "Скопировано" : "Копировать"}
            </button>
          </p>
          <p className="select-all break-all rounded-xl bg-black/30 px-4 py-3 font-mono text-sm text-emerald-200">
            {order.deliveryInfo}
          </p>
        </div>
      )}

      {role === "seller" && order.sellerAmount > 0 && (
        <p className="mt-3 rounded-2xl bg-muted/40 px-4 py-2.5 text-sm">
          {order.status === "COMPLETED" ? (
            <span className="text-amber-400">
              К получению: <b>{formatPrice(order.sellerAmount)}</b> · заморожены до {formatDate(order.fundsReleaseAt)}
            </span>
          ) : order.status === "DELIVERED" || order.status === "PAID" ? (
            <span className="text-muted-foreground">
              К получению после подтверждения: <b className="text-amber-400">{formatPrice(order.sellerAmount)}</b>
            </span>
          ) : (
            <span className="text-muted-foreground">К получению: <b>{formatPrice(order.sellerAmount)}</b></span>
          )}
        </p>
      )}

      {order.review && (
        <div className="mt-3 rounded-2xl border border-border/60 p-4">
          <p className="flex items-center gap-1 text-amber-400">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className={cn("h-4 w-4", s <= order.review!.rating ? "fill-current" : "opacity-25")} />
            ))}
          </p>
          {order.review.comment && <p className="mt-2 text-sm text-muted-foreground">«{order.review.comment}»</p>}
        </div>
      )}

      {role === "buyer" && order.status === "DELIVERED" && (
        <Button onClick={() => setReviewOpen(true)} variant="secondary" className="mt-4 w-full sm:w-auto">
          <Star className="h-4 w-4" /> Подтвердить получение и оценить
        </Button>
      )}

      {role === "seller" && order.status === "PAID" && (
        <div className="mt-4 space-y-2">
          <Textarea
            rows={2}
            placeholder="Введите ключ, логин или инструкцию для покупателя…"
            value={deliveryText}
            onChange={(e) => setDeliveryText(e.target.value)}
          />
          <Button onClick={deliver} className="w-full sm:w-auto" disabled={delivering}>
            {delivering ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Отгрузить товар
          </Button>
        </div>
      )}

      {order.status === "PENDING" && (
        <p className="mt-3 text-xs text-muted-foreground">Создан {timeAgo(order.createdAt)}</p>
      )}

      <Link
        href={`/orders/${order.id}`}
        className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-sky-400 transition hover:text-sky-300"
      >
        Открыть страницу заказа →
      </Link>

      <Dialog open={reviewOpen} onOpenChange={(o) => !o && setReviewOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Подтвердить получение</DialogTitle>
            <DialogDescription>
              Оцените сделку. После подтверждения средства продавца будут заморожены на 3 дня.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-1.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  className="rounded-lg p-1 transition hover:scale-110"
                  aria-label={`Оценка ${s}`}
                >
                  <Star className={cn("h-7 w-7", s <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")} />
                </button>
              ))}
            </div>
            <Textarea
              rows={3}
              placeholder="Комментарий к отзыву (необязательно)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <Button onClick={confirm} className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Подтвердить заказ
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
