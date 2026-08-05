import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { topUpSchema } from "@/lib/validations";
import { error, json } from "@/lib/api";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return error("Требуется авторизация", 401);

  const topUps = await prisma.topUpRequest.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  return json({ topUps });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return error("Требуется авторизация", 401);

  const body = await req.json().catch(() => null);
  const parsed = topUpSchema.safeParse(body);
  if (!parsed.success) return error(parsed.error.issues[0]?.message ?? "Ошибка валидации", 422);

  const settings = await prisma.siteSetting.findUnique({ where: { id: "main" } });
  const minTopUp = settings?.minTopUp ?? 1;
  if (parsed.data.amount < minTopUp) return error(`Минимальная сумма пополнения — ${minTopUp} ₽`, 422);

  const topUp = await prisma.topUpRequest.create({
    data: {
      userId: session.user.id,
      amount: parsed.data.amount,
      method: parsed.data.method,
      comment: parsed.data.comment,
      proofUrl: body?.proofUrl,
    },
  });

  const admins = await prisma.user.findMany({
    where: { role: "ROLE_ADMIN" },
    select: { id: true },
  });
  await prisma.notification.createMany({
    data: admins.map((a) => ({
      userId: a.id,
      title: "Новая заявка на пополнение",
      body: `${session.user.name} запросил(а) пополнение на ${parsed.data.amount.toLocaleString("ru-RU")} ₽`,
      type: "topup",
    })),
  });

  return json({ topUp }, 201);
}
