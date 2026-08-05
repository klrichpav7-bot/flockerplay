import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { error, json, isAdmin } from "@/lib/api";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!isAdmin(session)) return error("Нет доступа", 403);

  const body = await req.json().catch(() => ({}));
  const amount = Math.round(Number(body?.amount));
  if (!Number.isFinite(amount) || amount === 0) return error("Укажите сумму изменения", 422);

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return error("Пользователь не найден", 404);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id },
      data: { balance: { increment: amount } },
    });
    await tx.balanceTransaction.create({
      data: {
        userId: id,
        type: "ADMIN",
        amount,
        reason: `Корректировка администратором${body?.reason ? `: ${body.reason}` : ""}`,
      },
    });
    await tx.notification.create({
      data: {
        userId: id,
        title: amount > 0 ? "Баланс пополнен" : "Изменение баланса",
        body: `${amount > 0 ? "+" : ""}${amount.toLocaleString("ru-RU")} ₽ от администратора`,
        type: "topup",
      },
    });
  });

  const updated = await prisma.user.findUnique({ where: { id } });
  return json({ user: updated });
}
