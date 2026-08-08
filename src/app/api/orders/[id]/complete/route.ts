import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { error, json } from "@/lib/api";
import { freezeDates } from "@/lib/finance";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return error("Требуется авторизация", 401);

  const body = await req.json().catch(() => ({}));
  const rating = Math.round(Number(body?.rating));
  const comment = typeof body?.comment === "string" ? body.comment.trim().slice(0, 1000) : "";

  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return error("Оцените сделку от 1 до 5 звёзд", 422);
  }

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return error("Заказ не найден", 404);
  if (order.buyerId !== session.user.id) return error("Нет прав", 403);
  if (order.status !== "DELIVERED") return error("Сначала дождитесь доставки", 409);

  const frozen = freezeDates();

  const result = await prisma.$transaction(async (tx) => {
    let review = null;
    const existing = await tx.review.findUnique({ where: { orderId: id } });
    if (!existing && order.productId) {
      review = await tx.review.create({
        data: {
          orderId: id,
          productId: order.productId,
          buyerId: order.buyerId,
          sellerId: order.sellerId,
          rating,
          comment: comment || null,
        },
      });

      if (order.productId) {
        const product = await tx.product.findUnique({ where: { id: order.productId } });
        if (product) {
          await tx.product.update({
            where: { id: order.productId },
            data: {
              rating: (product.rating * product.ratingCount + rating) / (product.ratingCount + 1),
              ratingCount: product.ratingCount + 1,
            },
          });
        }
      }
    }

    const updated = await tx.order.update({
      where: { id },
      data: {
        status: "COMPLETED",
        fundsFrozenAt: frozen.fundsFrozenAt,
        fundsReleaseAt: frozen.fundsReleaseAt,
      },
    });

    if (order.sellerAmount > 0) {
      await tx.user.update({
        where: { id: order.sellerId },
        data: { heldBalance: { increment: order.sellerAmount } },
      });
      await tx.notification.create({
        data: {
          userId: order.sellerId,
          title: "Сделка подтверждена",
          body: `Заказ завершён. ${order.sellerAmount.toLocaleString("ru-RU")} ₽ заморожены на 3 дня и будут доступны для вывода после разморозки.`,
          type: "order",
        },
      });
    }

    return { order: updated, review };
  });

  return json({ order: result.order, review: result.review });
}
