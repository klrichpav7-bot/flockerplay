import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { error, json, isAdmin } from "@/lib/api";

export async function GET() {
  const session = await auth();
  if (!isAdmin(session)) return error("Нет доступа", 403);

  const [users, products, orders, topUps, complaints, pendingTopUps, pendingProducts, openTickets, pendingBanners, salesAgg, purchaseAgg] =
    await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.order.count(),
      prisma.topUpRequest.count(),
      prisma.complaint.count(),
      prisma.topUpRequest.count({ where: { status: "PENDING" } }),
      prisma.product.count({ where: { status: "PENDING" } }),
      prisma.ticket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
      prisma.banner.count({ where: { status: "PENDING" } }),
      prisma.balanceTransaction.aggregate({ where: { type: "SALE" }, _sum: { amount: true } }),
      prisma.balanceTransaction.aggregate({ where: { type: "PURCHASE" }, _sum: { amount: true } }),
    ]);

  const lastOrders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 6,
    include: {
      buyer: { select: { name: true } },
      product: { select: { title: true, images: true } },
    },
  });

  const lastTopUps = await prisma.topUpRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { user: { select: { name: true, email: true } } },
  });

  return json({
    stats: {
      users,
      products,
      orders,
      topUps,
      complaints,
      pendingTopUps,
      pendingProducts,
      openTickets,
      pendingBanners,
      revenue: salesAgg._sum.amount ?? 0,
      purchases: purchaseAgg._sum.amount ?? 0,
    },
    lastOrders,
    lastTopUps,
  });
}
