import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { messageSchema } from "@/lib/validations";
import { error, json, isAdmin } from "@/lib/api";

async function findTicket(id: string) {
  return prisma.ticket.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, isVerified: true, avatarUrl: true } },
      order: {
        select: {
          id: true,
          status: true,
          total: true,
          qty: true,
          fundsFrozenAt: true,
          fundsReleaseAt: true,
          createdAt: true,
          product: { select: { id: true, title: true, images: true, price: true } },
          buyer: { select: { id: true, name: true, isVerified: true, avatarUrl: true } },
          seller: { select: { id: true, name: true, isVerified: true, avatarUrl: true } },
        },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { id: true, name: true, role: true, avatarUrl: true } } },
      },
    },
  });
}

function canAccess(sessionUserId: string, ticket: Awaited<ReturnType<typeof findTicket>>, isAdminUser: boolean) {
  if (!ticket) return false;
  if (ticket.userId === sessionUserId || isAdminUser) return true;
  const o = ticket.order;
  if (o && (o.buyer.id === sessionUserId || o.seller.id === sessionUserId)) return true;
  return false;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return error("Требуется авторизация", 401);

  const ticket = await findTicket(id);
  if (!canAccess(session.user.id, ticket, isAdmin(session))) return error("Нет доступа", 403);

  return json({ ticket });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return error("Требуется авторизация", 401);

  const body = await req.json().catch(() => null);
  const parsed = messageSchema.safeParse(body);
  if (!parsed.success) return error(parsed.error.issues[0]?.message ?? "Ошибка валидации", 422);

  const ticket = await findTicket(id);
  if (!canAccess(session.user.id, ticket, isAdmin(session))) return error("Нет доступа", 403);
  if (ticket!.status === "CLOSED") return error("Тикет закрыт", 409);

  const message = await prisma.message.create({
    data: { ticketId: id, senderId: session.user.id, body: parsed.data.body },
  });
  await prisma.ticket.update({
    where: { id },
    data: { updatedAt: new Date(), status: isAdmin(session) ? "IN_PROGRESS" : ticket!.status },
  });

  const io = (globalThis as { __io?: { to: (room: string) => { emit: (e: string, p: unknown) => void } } }).__io;

  if (isAdmin(session)) {
    await prisma.notification.create({
      data: {
        userId: ticket!.userId,
        title: "Новый ответ поддержки",
        body: parsed.data.body.slice(0, 120),
        type: "support",
      },
    });
    const participants = new Set<string>();
    if (ticket!.order) {
      participants.add(ticket!.order.buyer.id);
      participants.add(ticket!.order.seller.id);
    }
    for (const pid of participants) {
      if (pid !== ticket!.userId) {
        await prisma.notification.create({
          data: {
            userId: pid,
            title: "Новое сообщение в споре",
            body: parsed.data.body.slice(0, 120),
            type: "support",
          },
        });
      }
      io?.to(`user:${pid}`).emit("support:new-message", {
        ticketId: id,
        senderId: session.user.id,
        message: { id: message.id, senderId: session.user.id, body: parsed.data.body, createdAt: message.createdAt },
      });
    }
    io?.to(`user:${ticket!.userId}`).emit("support:new-message", {
      ticketId: id,
      senderId: session.user.id,
      message: { id: message.id, senderId: session.user.id, body: parsed.data.body, createdAt: message.createdAt },
    });
  } else {
    io?.to(`user:${ticket!.userId}`).emit("support:new-message", {
      ticketId: id,
      senderId: session.user.id,
      message: { id: message.id, senderId: session.user.id, body: parsed.data.body, createdAt: message.createdAt },
    });
    if (ticket!.order) {
      const other = ticket!.order.buyer.id === session.user.id ? ticket!.order.seller.id : ticket!.order.buyer.id;
      io?.to(`user:${other}`).emit("support:new-message", {
        ticketId: id,
        userId: ticket!.order.buyer.id,
        senderId: session.user.id,
        message: { id: message.id, senderId: session.user.id, body: parsed.data.body, createdAt: message.createdAt },
      });
    }
    io?.to("admin").emit("support:new-message", {
      ticketId: id,
      userId: ticket!.userId,
      senderId: session.user.id,
      message: { id: message.id, senderId: session.user.id, body: parsed.data.body, createdAt: message.createdAt },
    });
  }

  return json({ message }, 201);
}
