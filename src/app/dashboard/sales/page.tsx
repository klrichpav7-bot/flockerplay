import Link from "next/link";
import { Lock, Package, PlusCircle, ShoppingBag, TrendingUp, Wallet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { releaseMaturedFunds } from "@/lib/finance";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function SalesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  await releaseMaturedFunds();

  const [user, soldOrders, products, revenueAgg, pendingDelivery, topProducts, settings] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.order.count({ where: { sellerId: userId, status: { in: ["PAID", "DELIVERED", "COMPLETED"] } } }),
    prisma.product.findMany({ where: { sellerId: userId } }),
    prisma.balanceTransaction.aggregate({ where: { userId, type: "SALE" }, _sum: { amount: true } }),
    prisma.order.count({ where: { sellerId: userId, status: "PAID" } }),
    prisma.order.findMany({
      where: { sellerId: userId, status: { in: ["PAID", "DELIVERED", "COMPLETED"] } },
      include: { product: { select: { title: true, price: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.siteSetting.findUnique({ where: { id: "main" } }),
  ]);

  if (!user) redirect("/login");

  const totalProducts = products.length;
  const approvedCount = products.filter((p) => p.status === "APPROVED").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Кабинет продавца</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {user.isSeller ? "Вы продаёте на FlockerPlay" : "Станьте продавцом — добавьте первый товар"}
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/products/new">
            <PlusCircle className="h-4 w-4" /> Добавить товар
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-3xl border border-emerald-500/25 bg-emerald-500/10 p-5">
          <Wallet className="h-5 w-5 text-emerald-400" />
          <p className="mt-3 text-2xl font-bold text-emerald-400">{formatPrice(revenueAgg._sum.amount ?? 0)}</p>
          <p className="text-xs text-muted-foreground">Заработано</p>
        </div>
        <div className="rounded-3xl border border-border bg-card/60 p-5">
          <ShoppingBag className="h-5 w-5 text-sky-400" />
          <p className="mt-3 text-2xl font-bold">{soldOrders}</p>
          <p className="text-xs text-muted-foreground">Продано</p>
        </div>
        <div className="rounded-3xl border border-border bg-card/60 p-5">
          <Package className="h-5 w-5 text-violet-400" />
          <p className="mt-3 text-2xl font-bold">{approvedCount}/{totalProducts}</p>
          <p className="text-xs text-muted-foreground">Опубликовано товаров</p>
        </div>
        <div className="rounded-3xl border border-amber-500/25 bg-amber-500/10 p-5">
          <TrendingUp className="h-5 w-5 text-amber-400" />
          <p className="mt-3 text-2xl font-bold">{pendingDelivery}</p>
          <p className="text-xs text-muted-foreground">Ждут выдачи</p>
        </div>
        <div className="rounded-3xl border border-amber-500/25 bg-amber-500/10 p-5">
          <Lock className="h-5 w-5 text-amber-400" />
          <p className="mt-3 text-2xl font-bold text-amber-400">{formatPrice(user.heldBalance)}</p>
          <p className="text-xs text-muted-foreground">Заморожено на 3 дня</p>
        </div>
      </div>

      <div className="rounded-3xl border border-border/80 bg-card/60 p-6">
        <p className="text-sm text-muted-foreground">
          Комиссия платформы: <b className="text-foreground">{settings?.commission ?? 0}%</b>. После подтверждения сделки покупателем
          выручка замораживается на 3 дня, затем становится доступной в разделе{" "}
          <Link href="/dashboard/withdrawals" className="font-medium text-sky-400 hover:text-sky-300">
            «Вывод средств»
          </Link>
          .
        </p>
      </div>

      {pendingDelivery > 0 && (
        <div className="rounded-3xl border border-amber-500/25 bg-amber-500/10 p-6">
          <p className="font-semibold text-amber-400">У вас {pendingDelivery} {pluralOrders(pendingDelivery)} ожидают выдачи</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Покупатели ждут ключи и данные. Отгрузите товары в разделе «Мои заказы».
          </p>
          <Button asChild variant="secondary" className="mt-4">
            <Link href="/dashboard/orders?tab=seller">Перейти к заказам</Link>
          </Button>
        </div>
      )}

      <div className="rounded-3xl border border-border/80 bg-card/60 p-6">
        <h2 className="mb-4 font-semibold">Последние продажи</h2>
        {topProducts.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Продаж пока нет. Добавьте товары и привлеките первых покупателей.
          </p>
        ) : (
          <div className="space-y-2">
            {topProducts.map((o) => (
              <div key={o.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 px-4 py-3">
                <p className="min-w-0 truncate text-sm font-medium">{o.product?.title ?? "Товар"}</p>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-emerald-400">+{formatPrice(o.sellerAmount)}</p>
                  <p className="text-[11px] text-muted-foreground">к получению · {formatPrice(o.total)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function pluralOrders(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "заказ";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "заказа";
  return "заказов";
}
