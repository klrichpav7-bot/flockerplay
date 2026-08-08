import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { error, json, isAdmin } from "@/lib/api";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!isAdmin(session)) return error("Нет доступа", 403);

  const body = await req.json().catch(() => ({}));
  const action = String(body?.action ?? "").toUpperCase();
  const adminNote = String(body?.adminNote ?? "").trim();

  const withdrawal = await prisma.withdrawal.findUnique({ where: { id } });
  if (!withdrawal) return error("Заявка не найдена", 404);
  if (withdrawal.status !== "PENDING") return error("Заявка уже рассмотрена", 409);

  if (action === "APPROVE") {
    await prisma.$transaction(async (tx) => {
      await tx.withdrawal.update({
        where: { id },
        data: { status: "APPROVED", adminNote, reviewedAt: new Date() },
      });
      await tx.notification.create({
        data: {
          userId: withdrawal.userId,
          title: "Вывод средств подтверждён",
          body: `Заявка на ${withdrawal.amount.toLocaleString("ru-RU")} ₽ одобрена. Перевод будет выполнен в течение 24 часов.`,
          type: "topup",
        },
      });
    });
    return json({ ok: true });
  }

  if (action === "REJECT") {
    await prisma.$transaction(async (tx) => {
      await tx.withdrawal.update({
        where: { id },
        data: { status: "REJECTED", adminNote, reviewedAt: new Date() },
      });
      await tx.user.update({
        where: { id: withdrawal.userId },
        data: { balance: { increment: withdrawal.amount } },
      });
      await tx.balanceTransaction.create({
        data: {
          userId: withdrawal.userId,
          type: "RECHARGE",
          amount: withdrawal.amount,
          reason: "Возврат средств (вывод отклонён)",
        },
      });
      await tx.notification.create({
        data: {
          userId: withdrawal.userId,
          title: "Вывод средств отклонён",
          body: adminNote || `Заявка на ${withdrawal.amount.toLocaleString("ru-RU")} ₽ отклонена. Средства возвращены на баланс.`,
          type: "topup",
        },
      });
    });
    return json({ ok: true });
  }

  return error("Неизвестное действие", 422);
}
