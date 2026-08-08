import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { error, json } from "@/lib/api";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return error("Требуется авторизация", 401);

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { promoDiscountId: true },
  });

  if (!user?.promoDiscountId) return json({ discount: null });

  const promo = await prisma.promoCode.findUnique({
    where: { id: user.promoDiscountId },
    select: { id: true, code: true, type: true, value: true, active: true, expiresAt: true, startsAt: true },
  });

  const valid =
    promo &&
    promo.active &&
    (!promo.startsAt || new Date() >= promo.startsAt) &&
    (!promo.expiresAt || new Date() <= promo.expiresAt);

  if (!valid) {
    await prisma.user.update({ where: { id: session.user.id }, data: { promoDiscountId: null } });
    return json({ discount: null });
  }

  return json({ discount: { code: promo.code, value: promo.value, expiresAt: promo.expiresAt } });
}
