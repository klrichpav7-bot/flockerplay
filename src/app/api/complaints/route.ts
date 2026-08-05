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

  const complaint = await prisma.complaint.create({
    data: {
      reporterId: session.user.id,
      targetId: parsed.data.targetId,
      orderId: parsed.data.orderId || null,
      reason: parsed.data.reason,
      text: parsed.data.text,
    },
  });

  const admins = await prisma.user.findMany({ where: { role: "ROLE_ADMIN" }, select: { id: true } });
  await prisma.notification.createMany({
    data: admins.map((a) => ({
      userId: a.id,
      title: "Новая жалоба",
      body: `${session.user.name} пожаловался на ${target.name}: ${parsed.data.reason}`,
      type: "complaint",
    })),
  });

  return json({ complaint }, 201);
}
