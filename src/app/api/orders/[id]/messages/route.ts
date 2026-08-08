import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { messageSchema } from "@/lib/validations";
import { error, json } from "@/lib/api";

async function canAccess(orderId: string, userId: string): Promise<boolean> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return false;
  return order.buyerId === userId || order.sellerId === userId;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return error("Требуется авторизация", 401);
  if (!(await canAccess(id, session.user.id))) return error("Нет доступа", 403);

  const order = await prisma.order.findUnique({
    where: { id },
    select: { buyerId: true, sellerId: true },
  });
  if (!order) return error("Заказ не найден", 404);

  const isBuyer = order.buyerId === session.user.id;
  await prisma.order.update({
    where: { id },
    data: isBuyer ? { buyerLastReadAt: new Date() } : { sellerLastReadAt: new Date() },
  });

  const messages = await prisma.orderMessage.findMany({
    where: { orderId: id },
    orderBy: { createdAt: "asc" },
    include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
  });

  return json({ messages });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return error("Требуется авторизация", 401);
  if (!(await canAccess(id, session.user.id))) return error("Нет доступа", 403);

  const body = await req.json().catch(() => null);
  const parsed = messageSchema.safeParse(body);
  if (!parsed.success) return error(parsed.error.issues[0]?.message ?? "Ошибка валидации", 422);

  const order = await prisma.order.findUnique({ where: { id }, select: { buyerId: true, sellerId: true } });
  if (!order) return error("Заказ не найден", 404);

  const message = await prisma.orderMessage.create({
    data: { orderId: id, senderId: session.user.id, body: parsed.data.body },
    include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
  });

  const io = (globalThis as { __io?: { to: (room: string) => { emit: (e: string, p: unknown) => void } } }).__io;
  const payload = {
    orderId: id,
    message: {
      id: message.id,
      senderId: session.user.id,
      senderName: message.sender.name,
      senderAvatar: message.sender.avatarUrl,
      body: parsed.data.body,
      createdAt: message.createdAt,
    },
  };
  io?.to(`user:${order.buyerId}`).emit("order:new-message", payload);
  io?.to(`user:${order.sellerId}`).emit("order:new-message", payload);
  io?.to("admin").emit("order:new-message", payload);

  return json({ message }, 201);
}
