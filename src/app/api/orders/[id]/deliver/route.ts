import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { error, json } from "@/lib/api";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return error("Требуется авторизация", 401);

  const body = await req.json().catch(() => ({}));
  const deliveryInfo = (body?.deliveryInfo as string)?.trim();

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return error("Заказ не найден", 404);
  if (order.sellerId !== session.user.id) return error("Нет прав", 403);
  if (order.status !== "PAID") return error("Заказ нельзя отгрузить", 409);
  if (!deliveryInfo) return error("Укажите способ выдачи", 422);

  const updated = await prisma.order.update({
    where: { id },
    data: { status: "DELIVERED", deliveryInfo, deliveredAt: new Date() },
  });

  await prisma.notification.create({
    data: {
      userId: order.buyerId,
      title: "Заказ доставлен",
      body: "Продавец отправил вам данные. Загляните в детали заказа.",
      type: "order",
    },
  });

  return json({ order: updated });
}
