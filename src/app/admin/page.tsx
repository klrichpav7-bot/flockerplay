import Link from "next/link";
import { Banknote, CheckCircle2, Clock, Flag, Megaphone, Package, ShoppingBag, Users, Wallet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPrice, timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [users, products, orders, pendingTopUps, pendingProducts, pendingBanners, openTickets, pendingComplaints, salesAgg, purchasesAgg] =
    await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.order.count(),
      prisma.topUpRequest.count({ where: { status: "PENDING" } }),
      prisma.product.count({ where: { status: "PENDING" } }),
      prisma.banner.count({ where: { status: "PENDING" } }),
      prisma.ticket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
      prisma.complaint.count({ where: { status: "PENDING" } }),
      prisma.balanceTransaction.aggregate({ where: { type: "SALE" }, _sum: { amount: true } }),
      prisma.balanceTransaction.aggregate({ where: { type: "RECHARGE" }, _sum: { amount: true } }),
    ]);

  const lastOrders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 8,
    include: {
      buyer: { select: { name: true } },
      seller: { select: { name: true } },
      product: { select: { title: true } },
    },
  });

  const cards = [
    { label: "Пользователи", value: users, icon: Users, href: "/admin/users" },
    { label: "Товары", value: products, icon: Package, href: "/admin/products" },
    { label: "Заказы", value: orders, icon: ShoppingBag, href: "/dashboard/orders" },
    { label: "Оборот продаж", value: formatPrice(salesAgg._sum.amount ?? 0), icon: Banknote, href: "/admin/products" },
  ];

  const moderation = [
    { label: "Пополнения на проверке", value: pendingTopUps, icon: Wallet, href: "/admin/topups" },
    { label: "Товары на модерации", value: pendingProducts, icon: Package, href: "/admin/products" },
    { label: "Баннеры на модерации", value: pendingBanners, icon: Megaphone, href: "/admin/banners" },
    { label: "Открытые тикеты", value: openTickets, icon: CheckCircle2, href: "/admin/tickets" },
    { label: "Жалобы без ответа", value: pendingComplaints, icon: Flag, href: "/admin/complaints" },
    { label: "Пополнено на баланс", value: formatPrice(purchasesAgg._sum.amount ?? 0), icon: Clock, href: "/admin/topups" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Панель управления</h1>
        <p className="mt-1 text-sm text-muted-foreground">Сводка по площадке и очередь на модерацию.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-3xl border border-border/80 bg-card/60 p-5 transition hover:border-primary/40"
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <c.icon className="h-4 w-4" /> {c.label}
            </div>
            <p className="mt-2 font-display text-2xl font-bold">{c.value}</p>
          </Link>
        ))}
      </div>

      <div className="rounded-3xl border border-border/80 bg-card/60 p-6">
        <h2 className="mb-4 font-semibold">Требует внимания</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {moderation.map((m) => (
            <Link
              key={m.label}
              href={m.href}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 px-4 py-3.5 transition hover:border-primary/40"
            >
              <span className="flex items-center gap-2.5 text-sm font-medium">
                <m.icon className="h-4 w-4 text-muted-foreground" /> {m.label}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  m.value === 0 ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"
                }`}
              >
                {m.value}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-border/80 bg-card/60 p-6">
        <h2 className="mb-4 font-semibold">Последние заказы</h2>
        {lastOrders.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Заказов ещё нет</p>
        ) : (
          <div className="space-y-2">
            {lastOrders.map((o) => (
              <div key={o.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border/60 px-4 py-3 text-sm">
                <span className="font-medium">{o.product?.title ?? "Товар удалён"}</span>
                <span className="text-muted-foreground">
                  {o.buyer.name} → {o.seller.name}
                </span>
                <span className="font-semibold">{formatPrice(o.total)}</span>
                <span className="text-xs text-muted-foreground">{timeAgo(o.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
