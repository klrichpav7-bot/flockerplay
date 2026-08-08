import { prisma } from "@/lib/prisma";

export type PromoError = { error: string; promo?: undefined } | { error?: undefined; promo: NonNullable<Awaited<ReturnType<typeof loadRawPromo>>> };

async function loadRawPromo(code: string) {
  return prisma.promoCode.findUnique({ where: { code: code.toUpperCase().trim() } });
}

export async function getValidPromo(code: string, userId: string): Promise<PromoError> {
  const promo = await loadRawPromo(code);
  if (!promo || !promo.active) return { error: "Промокод не найден" };
  if (promo.startsAt && new Date() < promo.startsAt) return { error: "Промокод ещё не действует" };
  if (promo.expiresAt && new Date() > promo.expiresAt) return { error: "Срок действия промокода истёк" };
  if (promo.maxUses > 0 && promo.uses >= promo.maxUses) return { error: "Лимит активаций исчерпан" };

  const used = await prisma.promoRedemption.findUnique({
    where: { promoId_userId: { promoId: promo.id, userId } },
  });
  if (used) return { error: "Этот промокод уже был активирован" };

  return { promo };
}
