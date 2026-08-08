import Link from "next/link";
import { Coins, Lock, Package, PlusCircle, ShoppingBag, TrendingUp, Wallet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { releaseMaturedFunds } from "@/lib/finance";
import { formatPrice, timeAgo } from "@/lib/format";
import { VerifiedBadge } from "@/components/shared/verified-badge";
import { PromoActivator } from "@/components/dashboard/promo-activator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

const statusLabel: Record<string, { label: string; className: string }> = {
  PENDING: { label: "В обработке", className: "bg-amber-500/15 text-amber-400" },
  PAID: { label: "Оплачен", className: "bg-sky-500/15 text-sky-400" },
  DELIVERED: { label: "Доставлен", className: "bg-violet-500/15 text-violet-400" },
  COMPLETED: { label: "Завершён", className: "bg-emerald-500/15 text-emerald-400" },
  CANCELLED: { label: "Отменён", className: "bg-rose-500/15 text-rose-400" },
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  await releaseMaturedFunds();

  const [user, orders, products, topUps, salesAgg, recentTx] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.order.findMany({
      where: { buyerId: userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { product: { select: { title: true } } },
    }),
    prisma.product.findMany({ where: { sellerId: userId }, select: { id: true } }),
    prisma.topUpRequest.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.balanceTransaction.aggregate({
      where: { userId, type: "SALE" },
      _sum: { amount: true },
    }),
    prisma.balanceTransaction.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  if (!user) redirect("/login");

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">
            Привет, {user.name}!
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            {user.isVerified && <VerifiedBadge size="xs" />}
            {user.isSeller ? "Статус: продавец" : "Статус: покупатель"}
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/dashboard/topup">
            <Coins className="h-4 w-4" /> Пополнить баланс
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-3xl border border-emerald-500/25 bg-emerald-500/10 p-5">
          <Wallet className="h-5 w-5 text-emerald-400" />
          <p className="mt-3 text-2xl font-bold text-emerald-400">{formatPrice(user.balance)}</p>
          <p className="text-xs text-muted-foreground">Баланс</p>
        </div>
        <div className="rounded-3xl border border-border bg-card/60 p-5">
          <ShoppingBag className="h-5 w-5 text-sky-400" />
          <p className="mt-3 text-2xl font-bold">{orders.length}</p>
          <p className="text-xs text-muted-foreground">Последние заказы</p>
        </div>
        <div className="rounded-3xl border border-border bg-card/60 p-5">
          <Package className="h-5 w-5 text-violet-400" />
          <p className="mt-3 text-2xl font-bold">{products.length}</p>
          <p className="text-xs text-muted-foreground">Мои товары</p>
        </div>
        <div className="rounded-3xl border border-border bg-card/60 p-5">
          <TrendingUp className="h-5 w-5 text-amber-400" />
          <p className="mt-3 text-2xl font-bold">{formatPrice(salesAgg._sum.amount ?? 0)}</p>
          <p className="text-xs text-muted-foreground">Доход с продаж</p>
        </div>
        <div className="rounded-3xl border border-amber-500/25 bg-amber-500/10 p-5">
          <Lock className="h-5 w-5 text-amber-400" />
          <p className="mt-3 text-2xl font-bold text-amber-400">{formatPrice(user.heldBalance)}</p>
          <p className="text-xs text-muted-foreground">Заморожено на 3 дня</p>
        </div>
      </div>

      {!user.isSeller && (
        <div className="flex flex-col items-start justify-between gap-4 rounded-3xl border border-primary/25 bg-gradient-to-r from-sky-600/15 to-violet-600/15 p-6 sm:flex-row sm:items-center">
          <div>
            <p className="font-semibold">Начните продавать прямо сейчас</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Добавьте первый товар — он появится в каталоге после модерации.
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/products/new">
              <PlusCircle className="h-4 w-4" /> Добавить товар
            </Link>
          </Button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-border/80 bg-card/60 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Последние заказы</h2>
            <Link href="/dashboard/orders" className="text-xs font-medium text-sky-400 hover:text-sky-300">
              Все заказы
            </Link>
          </div>
          {orders.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Пока нет заказов</p>
          ) : (
            <div className="space-y-2">
              {orders.map((o) => (
                <div key={o.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{o.product?.title ?? "Товар"}</p>
                    <p className="text-xs text-muted-foreground">{timeAgo(o.createdAt)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm font-semibold">{formatPrice(o.total)}</span>
                    <Badge className={statusLabel[o.status]?.className ?? ""}>{statusLabel[o.status]?.label ?? o.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-border/80 bg-card/60 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">История операций</h2>
            <Link href="/dashboard/topup" className="text-xs font-medium text-sky-400 hover:text-sky-300">
              Пополнения
            </Link>
          </div>
          {recentTx.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Операций пока нет</p>
          ) : (
            <div className="space-y-2">
              {recentTx.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{t.reason ?? t.type}</p>
                    <p className="text-xs text-muted-foreground">{timeAgo(t.createdAt)}</p>
                  </div>
                  <span className={t.amount >= 0 ? "text-sm font-semibold text-emerald-400" : "text-sm font-semibold text-rose-400"}>
                    {t.amount >= 0 ? "+" : ""}{formatPrice(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <PromoActivator />
    </div>
  );
}
