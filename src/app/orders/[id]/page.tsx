import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CalendarDays, Package, PartyPopper, ShieldCheck, Star } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { OrderDataReveal } from "@/components/orders/order-data-reveal";
import { OrderConfirm } from "@/components/orders/order-confirm";
import { OrderChat } from "@/components/orders/order-chat";
import { OrderDeliver } from "@/components/orders/order-deliver";
import { OrderComplaint } from "@/components/orders/order-complaint";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VerifiedBadge } from "@/components/shared/verified-badge";
import { formatDate, formatPrice, initials } from "@/lib/format";

export const dynamic = "force-dynamic";

const statusMap: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Ожидает оплаты", className: "bg-amber-500/15 text-amber-400" },
  PAID: { label: "Оплачен · ожидает выдачи", className: "bg-sky-500/15 text-sky-400" },
  DELIVERED: { label: "Доставлен", className: "bg-violet-500/15 text-violet-400" },
  COMPLETED: { label: "Завершён", className: "bg-emerald-500/15 text-emerald-400" },
  CANCELLED: { label: "Отменён", className: "bg-rose-500/15 text-rose-400" },
};

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/login?callbackUrl=${encodeURIComponent(`/orders/${id}`)}`);

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      product: { select: { id: true, title: true, images: true, deliveryType: true } },
      seller: { select: { id: true, name: true, avatarUrl: true, isVerified: true } },
      buyer: { select: { id: true, name: true, avatarUrl: true, isVerified: true } },
      review: true,
    },
  });

  if (!order) notFound();
  const isBuyer = order.buyerId === session.user.id;
  const isSeller = order.sellerId === session.user.id;
  const isAdminUser = session.user.role === "ROLE_ADMIN";
  if (!isBuyer && !isSeller && !isAdminUser) notFound();

  const st = statusMap[order.status] ?? { label: order.status, className: "" };
  const canReveal = Boolean(order.deliveryInfo) && (order.status === "DELIVERED" || order.status === "COMPLETED");
  const counterpart = isBuyer ? order.seller : order.buyer;
  const image = order.product?.images?.[0];

  return (
    <div className="section py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="relative overflow-hidden rounded-3xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-sky-500/15 p-8 text-center">
          <PartyPopper className="mx-auto h-12 w-12 text-emerald-400" />
          <h1 className="font-display mt-4 text-3xl font-bold">
            {isBuyer && (order.status === "DELIVERED" || order.status === "COMPLETED") ? "Поздравляем с покупкой!" : "Заказ оформлен"}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            {isBuyer && canReveal
              ? "Данные товара уже доступны — нажмите «Данные товара раскрыть», чтобы получить логин, пароль или ключи."
              : isBuyer
                ? "Продавец передаст данные после оформления выдачи. Следите за статусом заказа."
                : "Спасибо за продажу! Не забудьте отгрузить товар покупателю."}
          </p>
          <Badge className={`mt-4 ${st.className}`}>{st.label}</Badge>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <div className="flex gap-4 rounded-3xl border border-border/80 bg-card/60 p-5">
              <Link href={order.product ? `/product/${order.product.id}` : "#"} className="shrink-0 overflow-hidden rounded-2xl">
                {image ? (
                  <img src={image} alt="" className="h-20 w-20 object-cover" />
                ) : (
                  <span className="grid h-20 w-20 place-items-center bg-muted/40">
                    <Package className="h-8 w-8 text-muted-foreground/40" />
                  </span>
                )}
              </Link>
              <div className="min-w-0">
                <Link
                  href={order.product ? `/product/${order.product.id}` : "#"}
                  className="line-clamp-2 text-sm font-semibold transition hover:text-sky-400"
                >
                  {order.product?.title ?? "Товар"}
                </Link>
                <p className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> {formatDate(order.createdAt)}</span>
                  <span>№ {order.id.slice(0, 8)}</span>
                </p>
                <p className="mt-1 text-sm font-bold text-emerald-400">
                  {formatPrice(order.total)} ×{order.qty}
                </p>
              </div>
            </div>

            {isBuyer && canReveal && <OrderDataReveal deliveryInfo={order.deliveryInfo!} />}

            {isBuyer && order.status === "DELIVERED" && (
              <div className="rounded-3xl border border-border/80 bg-card/60 p-5">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" /> Сделка получена?
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Подтвердите получение — продавец получит оплату после 3 дней, а вы сможете оставить отзыв.
                </p>
                <div className="mt-4">
                  <OrderConfirm orderId={order.id} />
                </div>
              </div>
            )}

            {isSeller && order.status === "PAID" && (
              <div className="rounded-3xl border border-border/80 bg-card/60 p-5">
                <h3 className="text-sm font-semibold">Отгрузка товара</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Передайте покупателю данные для получения товара.
                </p>
                <div className="mt-4">
                  <OrderDeliver orderId={order.id} />
                </div>
              </div>
            )}

            {order.review && (
              <div className="rounded-3xl border border-border/60 p-5">
                <p className="flex items-center gap-1 text-amber-400">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`h-4 w-4 ${s <= order.review!.rating ? "fill-current" : "opacity-25"}`} />
                  ))}
                </p>
                {order.review.comment && <p className="mt-2 text-sm text-muted-foreground">«{order.review.comment}»</p>}
              </div>
            )}
          </div>

          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-3xl border border-border/80 bg-card/60 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {isBuyer ? "Продавец" : "Покупатель"}
              </p>
              <div className="mt-3 flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={counterpart?.avatarUrl ?? undefined} />
                  <AvatarFallback>{initials(counterpart?.name ?? "?")}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-semibold">
                    {counterpart?.name}
                    {counterpart?.isVerified && <VerifiedBadge size="xs" />}
                  </p>
                  <Link href={`/seller/${counterpart?.id}`} className="text-xs text-sky-400 hover:text-sky-300">
                    Открыть профиль продавца
                  </Link>
                </div>
              </div>
            </div>

            <OrderChat
              orderId={order.id}
              userId={session.user.id}
              userName={isBuyer ? order.buyer.name : order.seller.name}
              otherPartyName={counterpart?.name ?? "Участник сделки"}
              otherPartyAvatar={counterpart?.avatarUrl}
            />

            {isBuyer && (
              <OrderComplaint orderId={order.id} sellerId={order.seller.id} buyerName={order.seller.name} />
            )}

            <Link
              href="/dashboard/orders"
              className="flex items-center justify-center rounded-2xl border border-border bg-card/60 py-3 text-sm font-medium text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
            >
              Все заказы
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
