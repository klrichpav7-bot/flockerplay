import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ticketSchema } from "@/lib/validations";
import { error, json } from "@/lib/api";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return error("Требуется авторизация", 401);

  const tickets = await prisma.ticket.findMany({
    where: {
      OR: [{ userId: session.user.id }, { order: { buyerId: session.user.id } }, { order: { sellerId: session.user.id } }],
    },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { messages: true } } },
  });

  return json({ tickets });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return error("Требуется авторизация", 401);

  const body = await req.json().catch(() => null);
  const parsed = ticketSchema.safeParse(body);
  if (!parsed.success) return error(parsed.error.issues[0]?.message ?? "Ошибка валидации", 422);

  const ticket = await prisma.ticket.create({
    data: {
      userId: session.user.id,
      subject: parsed.data.subject,
      messages: body?.firstMessage
        ? { create: { senderId: session.user.id, body: String(body.firstMessage) } }
        : undefined,
    },
  });

  const admins = await prisma.user.findMany({ where: { role: "ROLE_ADMIN" }, select: { id: true } });
  await prisma.notification.createMany({
    data: admins.map((a) => ({
      userId: a.id,
      title: "Новый тикет поддержки",
      body: `${session.user.name}: «${parsed.data.subject}»`,
      type: "ticket",
    })),
  });

  return json({ ticket }, 201);
}
