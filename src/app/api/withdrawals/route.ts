import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { error, json } from "@/lib/api";
import { withdrawalSchema } from "@/lib/validations";
import { notifyAdmins, releaseMaturedFunds } from "@/lib/finance";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return error("Требуется авторизация", 401);

  await releaseMaturedFunds();

  const [user, withdrawals, settings] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id } }),
    prisma.withdrawal.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" } }),
    prisma.siteSetting.findUnique({ where: { id: "main" } }),
  ]);

  if (!user) return error("Пользователь не найден", 404);

  return json({
    balance: user.balance,
    heldBalance: user.heldBalance,
    minWithdrawal: settings?.minWithdrawal ?? 100,
    withdrawals,
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return error("Требуется авторизация", 401);

  const body = await req.json().catch(() => null);
  const parsed = withdrawalSchema.safeParse(body);
  if (!parsed.success) return error(parsed.error.issues[0]?.message ?? "Ошибка валидации", 422);

  await releaseMaturedFunds();

  const [user, settings] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id } }),
    prisma.siteSetting.findUnique({ where: { id: "main" } }),
  ]);
  if (!user) return error("Пользователь не найден", 404);

  const minWithdrawal = settings?.minWithdrawal ?? 100;
  const amount = parsed.data.amount;
  if (amount < minWithdrawal) {
    return error(`Минимальная сумма вывода — ${minWithdrawal.toLocaleString("ru-RU")} ₽`, 422);
  }
  if (amount > user.balance) {
    return error(`Недостаточно средств на балансе. Доступно: ${user.balance.toLocaleString("ru-RU")} ₽`, 422);
  }

  const withdrawal = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: session.user.id },
      data: { balance: { decrement: amount } },
    });
    await tx.balanceTransaction.create({
      data: {
        userId: session.user.id,
        type: "WITHDRAWAL",
        amount: -amount,
        reason: `Вывод средств: ${parsed.data.method}`,
      },
    });
    const w = await tx.withdrawal.create({
      data: {
        userId: session.user.id,
        amount,
        method: parsed.data.method,
        details: parsed.data.details,
      },
    });
    return w;
  });

  await notifyAdmins(
    "Новая заявка на вывод",
    `${session.user.name} запросил(а) вывод ${amount.toLocaleString("ru-RU")} ₽ (${parsed.data.method})`,
    "topup"
  );

  return json({ withdrawal }, 201);
}
