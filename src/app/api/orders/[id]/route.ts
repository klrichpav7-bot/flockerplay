import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { error, json, isAdmin } from "@/lib/api";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return error("Требуется авторизация", 401);

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      product: {
        select: { id: true, title: true, images: true, deliveryType: true, description: true },
      },
      buyer: { select: { id: true, name: true, isVerified: true, avatarUrl: true, email: true } },
      seller: { select: { id: true, name: true, isVerified: true, avatarUrl: true, email: true } },
    },
  });
  if (!order) return error("Заказ не найден", 404);

  const canView = order.buyerId === session.user.id || order.sellerId === session.user.id || isAdmin(session);
  if (!canView) return error("Нет доступа", 403);

  return json({ order });
}
