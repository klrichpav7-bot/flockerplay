import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { error, json, isAdmin } from "@/lib/api";
import type { TopUpStatus } from "@prisma/client";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!isAdmin(session)) return error("Нет доступа", 403);

  const body = await req.json().catch(() => ({}));
  const action = String(body?.action ?? "").toUpperCase();
  const adminNote = String(body?.adminNote ?? "").trim();

  const topUp = await prisma.topUpRequest.findUnique({
    where: { id },
    include: { user: true },
  });
  if (!topUp) return error("Заявка не найдена", 404);
  if (topUp.status !== "PENDING") return error("Заявка уже рассмотрена", 409);

  if (action === "APPROVE") {
    const result = await prisma.$transaction(async (tx) => {
      await tx.topUpRequest.update({
        where: { id },
        data: { status: "APPROVED", adminNote, reviewedAt: new Date() },
      });
      await tx.user.update({
        where: { id: topUp.userId },
        data: { balance: { increment: topUp.amount } },
      });
      await tx.balanceTransaction.create({
        data: {
          userId: topUp.userId,
          type: "RECHARGE",
          amount: topUp.amount,
          reason: `Пополнение баланса (${topUp.method ?? "ручная проверка"})`,
        },
      });
      await tx.notification.create({
        data: {
          userId: topUp.userId,
          title: "Баланс пополнен",
          body: `Заявка на ${topUp.amount.toLocaleString("ru-RU")} ₽ одобрена. Средства зачислены.`,
          type: "topup",
        },
      });
    });
    void result;
    return json({ ok: true });
  }

  if (action === "REJECT") {
    await prisma.topUpRequest.update({
      where: { id },
      data: { status: "REJECTED", adminNote, reviewedAt: new Date() },
    });
    await prisma.notification.create({
      data: {
        userId: topUp.userId,
        title: "Пополнение отклонено",
        body: adminNote || `Заявка на ${topUp.amount.toLocaleString("ru-RU")} ₽ отклонена администратором.`,
        type: "topup",
      },
    });
    return json({ ok: true });
  }

  return error("Неизвестное действие", 422);
}
