import { prisma } from "@/lib/prisma";

const YOO_WALLET = process.env.YOOMONEY_WALLET ?? "";

export function yoomoneyConfigured(): boolean {
  return Boolean(YOO_WALLET);
}

export function yoomoneyWallet(): string {
  return YOO_WALLET;
}

export function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function quickpayUrl(opts: { amount: number; label: string; returnUrl: string }): string {
  const params = new URLSearchParams({
    receiver: YOO_WALLET,
    "quickpay-form": "button",
    paymentType: "AC",
    targets: "Пополнение баланса FlockerPlay",
    sum: `${opts.amount}`,
    label: opts.label,
    successURL: opts.returnUrl,
    needFio: "false",
    needEmail: "false",
  });
  return `https://yoomoney.ru/quickpay/confirm.xml?${params.toString()}`;
}

export async function creditPayment(paymentId: string): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const p = await tx.payment.findUnique({ where: { id: paymentId } });
    if (!p || p.status === "SUCCEEDED") return false;

    await tx.payment.update({ where: { id: paymentId }, data: { status: "SUCCEEDED" } });
    await tx.user.update({ where: { id: p.userId }, data: { balance: { increment: p.amount } } });
    await tx.balanceTransaction.create({
      data: { userId: p.userId, type: "RECHARGE", amount: p.amount, reason: "Пополнение баланса через ЮMoney" },
    });
    await tx.notification.create({
      data: {
        userId: p.userId,
        title: "Баланс пополнен",
        body: `${p.amount.toLocaleString("ru-RU")} ₽ зачислены на баланс через ЮMoney.`,
        type: "topup",
      },
    });
    return true;
  });
}
