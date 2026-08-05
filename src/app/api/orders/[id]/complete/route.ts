import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { error, json } from "@/lib/api";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return error("Требуется авторизация", 401);

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return error("Заказ не найден", 404);
  if (order.buyerId !== session.user.id) return error("Нет прав", 403);
  if (order.status !== "DELIVERED") return error("Сначала дождитесь доставки", 409);

  const updated = await prisma.order.update({
    where: { id },
    data: { status: "COMPLETED" },
  });

  return json({ order: updated });
}
