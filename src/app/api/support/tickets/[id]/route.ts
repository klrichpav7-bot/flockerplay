import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { messageSchema } from "@/lib/validations";
import { error, json, isAdmin } from "@/lib/api";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return error("Требуется авторизация", 401);

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, isVerified: true, avatarUrl: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { id: true, name: true, role: true, avatarUrl: true } } },
      },
    },
  });
  if (!ticket) return error("Тикет не найден", 404);
  if (ticket.userId !== session.user.id && !isAdmin(session)) return error("Нет доступа", 403);

  return json({ ticket });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return error("Требуется авторизация", 401);

  const body = await req.json().catch(() => null);
  const parsed = messageSchema.safeParse(body);
  if (!parsed.success) return error(parsed.error.issues[0]?.message ?? "Ошибка валидации", 422);

  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) return error("Тикет не найден", 404);
  if (ticket.userId !== session.user.id && !isAdmin(session)) return error("Нет доступа", 403);
  if (ticket.status === "CLOSED") return error("Тикет закрыт", 409);

  const message = await prisma.message.create({
    data: { ticketId: id, senderId: session.user.id, body: parsed.data.body },
  });
  await prisma.ticket.update({
    where: { id },
    data: { updatedAt: new Date(), status: isAdmin(session) ? "IN_PROGRESS" : ticket.status },
  });

  if (isAdmin(session)) {
    await prisma.notification.create({
      data: {
        userId: ticket.userId,
        title: "Новый ответ поддержки",
        body: parsed.data.body.slice(0, 120),
        type: "support",
      },
    });
  }

  const io = (globalThis as { __io?: { to: (room: string) => { emit: (e: string, p: unknown) => void } } }).__io;
  io?.to(`user:${ticket.userId}`).emit("support:new-message", {
    ticketId: id,
    senderId: session.user.id,
    message: { id: message.id, senderId: session.user.id, body: parsed.data.body, createdAt: message.createdAt },
  });
  if (!isAdmin(session)) {
    io?.to("admin").emit("support:new-message", {
      ticketId: id,
      userId: ticket.userId,
      senderId: session.user.id,
      message: { id: message.id, senderId: session.user.id, body: parsed.data.body, createdAt: message.createdAt },
    });
  }

  return json({ message }, 201);
}
