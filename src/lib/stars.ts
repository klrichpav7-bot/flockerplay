import { prisma } from "@/lib/prisma";

export async function findStarsProduct() {
  const telegram = await prisma.category.findUnique({ where: { slug: "telegram" } });
  if (!telegram) return null;

  const starsSub = await prisma.subcategory.findFirst({
    where: { categoryId: telegram.id, slug: "stars", active: true },
  });

  const product = await prisma.product.findFirst({
    where: {
      status: "APPROVED",
      ...(starsSub ? { subcategoryId: starsSub.id } : {}),
      OR: [{ title: { contains: "звёзд", mode: "insensitive" } }],
    },
    orderBy: { createdAt: "asc" },
  });

  if (product) return product;

  return prisma.product.findFirst({
    where: { status: "APPROVED", title: { contains: "звёзд", mode: "insensitive" } },
    orderBy: { createdAt: "asc" },
  });
}

export function starsPrice(amount: number, rate: number): number {
  return Math.round(amount * rate);
}

export function starsRubles(amount: number, rate: number): number {
  return starsPrice(amount, rate) / 100;
}

export async function confirmStarsOrder(paymentId: string): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const p = await tx.payment.findUnique({ where: { id: paymentId } });
    if (!p || p.status === "SUCCEEDED") return false;
    if (!p.providerId?.startsWith("order:")) return false;

    const orderId = p.providerId.slice("order:".length);

    await tx.payment.update({ where: { id: paymentId }, data: { status: "SUCCEEDED" } });

    const order = await tx.order.update({
      where: { id: orderId },
      data: { status: "PAID" },
      include: { product: true, buyer: true, seller: true },
    });

    if (order.product && order.product.stock > 0) {
      await tx.product.update({ where: { id: order.product.id }, data: { stock: { decrement: order.qty } } });
    }
    await tx.product.update({
      where: { id: order.productId! },
      data: { soldCount: { increment: order.qty } },
    });

    await tx.notification.create({
      data: {
        userId: order.buyerId,
        title: "ТГ-звёзды оплачены",
        body: `Заказ №${orderId} оплачен (${(order.total / 100).toLocaleString("ru-RU")} ₽). Ожидайте доставку звёзд.`,
        type: "order",
      },
    });
    await tx.notification.create({
      data: {
        userId: order.sellerId,
        title: "Оплата получена",
        body: `Заказ №${orderId} на ${order.qty} звёзд оплачен покупателем.`,
        type: "order",
      },
    });

    return true;
  });
}

export async function rejectStarsOrder(paymentId: string): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const p = await tx.payment.findUnique({ where: { id: paymentId } });
    if (!p || p.status !== "PENDING") return false;
    if (!p.providerId?.startsWith("order:")) return false;

    await tx.payment.update({ where: { id: paymentId }, data: { status: "FAILED" } });
    const orderId = p.providerId.slice("order:".length);
    await tx.order.update({ where: { id: orderId }, data: { status: "CANCELLED" } });
    return true;
  });
}
