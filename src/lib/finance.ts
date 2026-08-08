import { prisma } from "@/lib/prisma";

export const FREEZE_DAYS = 3;
export const WITHDRAWAL_PROCESSING_HOURS = 24;

export function sellerAmountFor(price: number, qty: number, commission: number): number {
  const rate = Math.max(0, Math.min(100, commission));
  return Math.round((price * qty * (100 - rate)) / 100);
}

export function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

export function freezeDates(now: Date = new Date()): { fundsFrozenAt: Date; fundsReleaseAt: Date } {
  return {
    fundsFrozenAt: now,
    fundsReleaseAt: addDays(now, FREEZE_DAYS),
  };
}

export async function getSettings() {
  return prisma.siteSetting.findUnique({ where: { id: "main" } });
}

export async function getCommission(): Promise<number> {
  const s = await getSettings();
  return s?.commission ?? 0;
}

export async function notifyAdmins(title: string, body: string, type = "info") {
  const admins = await prisma.user.findMany({ where: { role: "ROLE_ADMIN" }, select: { id: true } });
  if (admins.length === 0) return;
  await prisma.notification.createMany({
    data: admins.map((a) => ({ userId: a.id, title, body, type })),
  });
}

export async function releaseMaturedFunds(): Promise<number> {
  const now = new Date();
  const due = await prisma.order.findMany({
    where: {
      fundsReleaseAt: { lte: now },
      fundsReleasedAt: null,
      sellerAmount: { gt: 0 },
    },
    select: {
      id: true,
      sellerId: true,
      sellerAmount: true,
      product: { select: { title: true } },
    },
  });

  if (due.length === 0) return 0;

  await prisma.$transaction(async (tx) => {
    for (const order of due) {
      await tx.user.update({
        where: { id: order.sellerId },
        data: {
          balance: { increment: order.sellerAmount },
          heldBalance: { decrement: order.sellerAmount },
        },
      });
      await tx.balanceTransaction.create({
        data: {
          userId: order.sellerId,
          type: "SALE",
          amount: order.sellerAmount,
          reason: `Доход по заказу: ${order.product?.title ?? "товар"}`,
        },
      });
      await tx.order.update({
        where: { id: order.id },
        data: { fundsReleasedAt: now },
      });
    }
  });

  return due.length;
}
