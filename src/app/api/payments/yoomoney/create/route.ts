import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { error, json } from "@/lib/api";
import { appUrl, quickpayUrl, yoomoneyConfigured } from "@/lib/yoomoney";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return error("Требуется авторизация", 401);

  const body = await req.json().catch(() => ({}));
  const amount = Math.round(Number(body?.amount));
  if (!Number.isFinite(amount) || amount < 1) return error("Укажите корректную сумму", 422);

  const settings = await prisma.siteSetting.findUnique({ where: { id: "main" } });
  const minTopUp = settings?.minTopUp ?? 1;
  if (amount < minTopUp) return error(`Минимальная сумма пополнения — ${minTopUp} ₽`, 422);

  if (!yoomoneyConfigured()) {
    return error("Платёжный шлюз ЮMoney ещё не настроен администратором", 501);
  }

  const payment = await prisma.payment.create({
    data: { userId: session.user.id, provider: "yoomoney", amount },
  });

  const returnUrl = `${appUrl()}/dashboard/topup?yoomoney=${payment.id}`;
  const confirmationUrl = quickpayUrl({ amount, label: payment.id, returnUrl });

  return json({ paymentId: payment.id, confirmationUrl });
}
