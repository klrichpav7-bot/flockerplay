import Link from "next/link";
import { Link2, Package, Snowflake } from "lucide-react";
import { VerifiedBadge } from "@/components/shared/verified-badge";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface DealOrder {
  id: string;
  status: string;
  total: number;
  qty: number;
  fundsFrozenAt: string | null;
  fundsReleaseAt: string | null;
  createdAt: string;
  product: { id: string; title: string; images: string[]; price: number } | null;
  buyer: { id: string; name: string; isVerified: boolean; avatarUrl: string | null };
  seller: { id: string; name: string; isVerified: boolean; avatarUrl: string | null };
}

const orderStatus: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Ожидает оплаты", className: "bg-muted text-muted-foreground" },
  PAID: { label: "Оплачен", className: "bg-sky-500/15 text-sky-400" },
  DELIVERED: { label: "Доставлен", className: "bg-emerald-500/15 text-emerald-400" },
  COMPLETED: { label: "Завершён", className: "bg-emerald-500/15 text-emerald-400" },
  CANCELLED: { label: "Отменён", className: "bg-rose-500/15 text-rose-400" },
};

export function DealContext({ order }: { order: DealOrder }) {
  const st = orderStatus[order.status];
  const product = order.product;

  return (
    <aside className="rounded-3xl border border-border/80 bg-card/60 p-4">
      <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Link2 className="h-3.5 w-3.5" /> Контекст сделки
      </p>

      {product ? (
        <Link
          href={`/product/${product.id}`}
          className="group flex gap-3 rounded-2xl border border-border/60 bg-muted/30 p-3 transition hover:border-primary/40"
        >
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted/40">
            {product.images[0] ? (
              <img src={product.images[0]} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="grid h-full w-full place-items-center">
                <Package className="h-6 w-6 text-muted-foreground/50" />
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="line-clamp-2 text-sm font-semibold group-hover:underline">{product.title}</p>
            <p className="mt-1 text-sm font-bold text-emerald-400">
              {formatPrice(product.price)}
              {order.qty > 1 ? ` × ${order.qty}` : ""}
            </p>
          </div>
        </Link>
      ) : (
        <p className="text-xs text-muted-foreground">Товар не указан</p>
      )}

      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex items-center justify-between gap-2">
          <dt className="text-muted-foreground">Заказ</dt>
          <dd className="font-mono text-xs">{order.id.slice(0, 8)}…</dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="text-muted-foreground">Сумма</dt>
          <dd className="font-bold">{formatPrice(order.total)}</dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="text-muted-foreground">Статус</dt>
          <dd>
            <Badge className={st?.className ?? "bg-muted text-muted-foreground"}>{st?.label ?? order.status}</Badge>
          </dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="text-muted-foreground">Средства</dt>
          <dd>
            {order.fundsFrozenAt ? (
              <Badge className="bg-amber-500/15 text-amber-400">
                <Snowflake className="h-3 w-3" /> Заморожены
              </Badge>
            ) : (
              <Badge className="bg-emerald-500/15 text-emerald-400">Активны</Badge>
            )}
          </dd>
        </div>
      </dl>

      <div className="mt-4 space-y-2 border-t border-border/60 pt-3 text-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Покупатель</span>
          <Link
            href={`/seller/${order.buyer.id}`}
            className={cn("flex items-center gap-1 font-medium transition hover:underline")}
          >
            {order.buyer.name} {order.buyer.isVerified && <VerifiedBadge size="xs" />}
          </Link>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Продавец</span>
          <Link
            href={`/seller/${order.seller.id}`}
            className={cn("flex items-center gap-1 font-medium transition hover:underline")}
          >
            {order.seller.name} {order.seller.isVerified && <VerifiedBadge size="xs" />}
          </Link>
        </div>
      </div>
    </aside>
  );
}
