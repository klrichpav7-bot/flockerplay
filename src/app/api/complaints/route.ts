import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { complaintSchema } from "@/lib/validations";
import { error, json } from "@/lib/api";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return error("Требуется авторизация", 401);

  const complaints = await prisma.complaint.findMany({
    where: { reporterId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      target: { select: { id: true, name: true, isVerified: true } },
    },
  });

  return json({ complaints });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return error("Требуется авторизация", 401);

  const body = await req.json().catch(() => null);
  const parsed = complaintSchema.safeParse(body);
  if (!parsed.success) return error(parsed.error.issues[0]?.message ?? "Ошибка валидации", 422);

  if (parsed.data.targetId === session.user.id) return error("Нельзя пожаловаться на себя", 422);

  const target = await prisma.user.findUnique({ where: { id: parsed.data.targetId } });
  if (!target) return error("Пользователь не найден", 404);

  let order: {
    id: string;
    buyerId: string;
    sellerId: string;
    status: string;
    buyer: { name: string };
    seller: { name: string };
  } | null = null;
  if (parsed.data.orderId) {
    order = await prisma.order.findUnique({
      where: { id: parsed.data.orderId },
      select: {
        id: true,
        buyerId: true,
        sellerId: true,
        status: true,
        buyer: { select: { name: true } },
        seller: { select: { name: true } },
      },
    });
    if (!order) return error("Заказ не найден", 404);
    if (order.buyerId !== session.user.id && order.sellerId !== session.user.id) {
      return error("Нет доступа к заказу", 403);
    }
  }

  const complaint = await prisma.complaint.create({
    data: {
      reporterId: session.user.id,
      targetId: parsed.data.targetId,
      orderId: parsed.data.orderId || null,
      reason: parsed.data.reason,
      text: parsed.data.text,
    },
  });

  // Спор по заказу: системное сообщение в чат + заморозка средств
  let ticketId: string | null = null;
  if (order && order.id) {
    await prisma.order.updateMany({
      where: { id: order.id, status: { in: ["PAID", "DELIVERED"] }, fundsFrozenAt: null },
      data: { fundsFrozenAt: new Date() },
    });

    const systemBody = `🛡️ [Система] ${session.user.name} открыл спор: «${parsed.data.reason}». Средства по заказу заморожены до решения администрации.`;
    const message = await prisma.orderMessage.create({
      data: { orderId: order.id, senderId: session.user.id, body: systemBody },
      include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
    });

    const io = (globalThis as { __io?: { to: (room: string) => { emit: (e: string, p: unknown) => void } } }).__io;
    const payload = {
      orderId: order.id,
      message: {
        id: message.id,
        senderId: message.senderId,
        senderName: message.sender.name,
        senderAvatar: message.sender.avatarUrl,
        body: systemBody,
        createdAt: message.createdAt,
      },
    };
    io?.to(`user:${order.buyerId}`).emit("order:new-message", payload);
    io?.to(`user:${order.sellerId}`).emit("order:new-message", payload);
    io?.to("admin").emit("order:new-message", payload);

    await prisma.notification.create({
      data: {
        userId: order.sellerId,
        title: "Открыт спор по заказу",
        body: `${session.user.name} подал жалобу: «${parsed.data.reason}». Средства заморожены до решения.`,
        type: "complaint",
      },
    });

    // Тикет-арбитраж: полноценный чат с контекстом сделки
    const ticket = await prisma.ticket.create({
      data: {
        userId: session.user.id,
        orderId: order.id,
        subject: `Арбитраж по заказу ${order.id.slice(0, 8)}`,
        messages: {
          create: {
            senderId: session.user.id,
            body: `⚖️ [Спор] ${parsed.data.reason}${parsed.data.text ? `\n\n${parsed.data.text}` : ""}`,
          },
        },
      },
    });
    ticketId = ticket.id;

    io?.to(`user:${order.buyerId}`).emit("support:new-ticket", { ticket });
    io?.to(`user:${order.sellerId}`).emit("support:new-ticket", { ticket });
    io?.to("admin").emit("support:new-ticket", { ticket });
  }

  const admins = await prisma.user.findMany({ where: { role: "ROLE_ADMIN" }, select: { id: true } });
  await prisma.notification.createMany({
    data: admins.map((a) => ({
      userId: a.id,
      title: "Новая жалоба",
      body: `${session.user.name} пожаловался на ${target.name}: ${parsed.data.reason}`,
      type: "complaint",
    })),
  });

  return json({ complaint, ticketId }, 201);
}
