import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { error, json } from "@/lib/api";
import { promoActivateSchema } from "@/lib/validations";
import { getValidPromo } from "@/lib/promo";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return error("Требуется авторизация", 401);

  const body = await req.json().catch(() => null);
  const parsed = promoActivateSchema.safeParse(body);
  if (!parsed.success) return error(parsed.error.issues[0]?.message ?? "Введите промокод", 422);

  const checked = await getValidPromo(parsed.data.code, session.user.id);
  if (checked.error !== undefined) return error(checked.error, 422);
  const promo = checked.promo;

  if (promo.type === "DISCOUNT") {
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { promoDiscountId: true } });
    if (user?.promoDiscountId) {
      return error("У вас уже есть неиспользованная скидка — примените её при следующем заказе", 409);
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.promoRedemption.create({
      data: { promoId: promo.id, userId: session.user.id },
    });
    await tx.promoCode.update({ where: { id: promo.id }, data: { uses: { increment: 1 } } });

    if (promo.type === "BALANCE") {
      await tx.user.update({
        where: { id: session.user.id },
        data: { balance: { increment: promo.value } },
      });
      await tx.balanceTransaction.create({
        data: {
          userId: session.user.id,
          type: "PROMO",
          amount: promo.value,
          reason: `Промокод ${promo.code}`,
        },
      });
      await tx.notification.create({
        data: {
          userId: session.user.id,
          title: "Промокод активирован",
          body: `Баланс пополнен на ${promo.value.toLocaleString("ru-RU")} ₽`,
          type: "topup",
        },
      });
    } else {
      await tx.user.update({
        where: { id: session.user.id },
        data: { promoDiscountId: promo.id },
      });
      await tx.notification.create({
        data: {
          userId: session.user.id,
          title: "Скидка активирована",
          body: `Скидка ${promo.value}% будет применена при следующем заказе`,
          type: "info",
        },
      });
    }

    const fresh = await tx.user.findUnique({
      where: { id: session.user.id },
      select: { balance: true, promoDiscountId: true },
    });
    return fresh;
  });

  return json({
    ok: true,
    type: promo.type,
    value: promo.value,
    code: promo.code,
    balance: result?.balance ?? 0,
    hasDiscount: Boolean(result?.promoDiscountId),
  });
}
