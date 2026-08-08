import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { error, json } from "@/lib/api";
import { appUrl, quickpayUrl, yoomoneyConfigured } from "@/lib/yoomoney";
import { findStarsProduct, starsPrice } from "@/lib/stars";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return error("Требуется авторизация", 401);

  const [settings, product, user] = await Promise.all([
    prisma.siteSetting.findUnique({ where: { id: "main" } }),
    findStarsProduct(),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { balance: true } }),
  ]);

  const rate = settings?.starsRate ?? 150;
  return json({
    rate,
    pricePerStar: starsPrice(1, rate) / 100,
    min: settings?.starsMin ?? 100,
    max: settings?.starsMax ?? 100000,
    product: product
      ? {
          id: product.id,
          title: product.title,
          sellerId: product.sellerId,
          deliveryType: product.deliveryType,
          deliveryInfo: product.deliveryInfo,
        }
      : null,
    balance: user?.balance ?? 0,
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return error("Требуется авторизация", 401);

  const body = await req.json().catch(() => ({}));
  const amount = Math.floor(Number(body?.amount));
  const method = String(body?.method ?? "balance");
  const telegram = String(body?.telegram ?? "").trim().slice(0, 120);

  if (!Number.isInteger(amount) || amount <= 0) return error("Укажите количество звёзд", 422);
  if (!["balance", "yoomoney"].includes(method)) return error("Неверный способ оплаты", 422);

  const [settings, product, buyer] = await Promise.all([
    prisma.siteSetting.findUnique({ where: { id: "main" } }),
    findStarsProduct(),
    prisma.user.findUnique({ where: { id: session.user.id } }),
  ]);
  if (!buyer) return error("Пользователь не найден", 404);
  if (!product) return error("Раздел ТГ-звёзд ещё не настроен администратором", 501);

  const rate = settings?.starsRate ?? 150;
  const min = settings?.starsMin ?? 100;
  const max = settings?.starsMax ?? 100000;
  if (amount < min) return error(`Минимальная покупка — ${min.toLocaleString("ru-RU")} звёзд`, 422);
  if (amount > max) return error(`Максимальная покупка — ${max.toLocaleString("ru-RU")} звёзд`, 422);

  const total = starsPrice(amount, rate);
  if (total <= 0) return error("Некорректная сумма", 422);

  if (method === "balance") {
    if (buyer.balance < total) {
      return error(`Недостаточно средств на балансе. Нужно ${(total / 100).toLocaleString("ru-RU")} ₽`, 402);
    }

    const commission = settings?.commission ?? 0;
    const sellerAmount = Math.round((total * (100 - commission)) / 100);

    const result = await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: buyer.id }, data: { balance: { decrement: total } } });
      await tx.balanceTransaction.create({
        data: { userId: buyer.id, type: "PURCHASE", amount: -total, reason: `Покупка ${amount} ТГ-звёзд` },
      });

      if (product.stock > 0) {
        await tx.product.update({ where: { id: product.id }, data: { stock: { decrement: 1 } } });
      }

      const order = await tx.order.create({
        data: {
          buyerId: buyer.id,
          sellerId: product.sellerId,
          productId: product.id,
          total,
          qty: amount,
          sellerAmount,
          buyerNote: telegram ? `Telegram: ${telegram}` : null,
          status: "PAID",
          deliveryInfo: telegram || product.deliveryInfo,
        },
      });

      await tx.notification.create({
        data: {
          userId: buyer.id,
          title: "ТГ-звёзды куплены",
          body: `${amount.toLocaleString("ru-RU")} звёзд заказаны за ${(total / 100).toLocaleString("ru-RU")} ₽.`,
          type: "order",
        },
      });
      await tx.notification.create({
        data: {
          userId: product.sellerId,
          title: "Новый заказ на звёзды",
          body: `${amount.toLocaleString("ru-RU")} звёзд на ${(total / 100).toLocaleString("ru-RU")} ₽. Средства зачислятся после подтверждения сделки.`,
          type: "order",
        },
      });

      return order;
    });

    return json({ orderId: result.id, redirect: `/orders/${result.id}` }, 201);
  }

  // method === "yoomoney"
  if (!yoomoneyConfigured()) {
    return error("Платёжный шлюз ЮMoney ещё не настроен администратором", 501);
  }

  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        buyerId: buyer.id,
        sellerId: product.sellerId,
        productId: product.id,
        total,
        qty: amount,
        sellerAmount: Math.round((total * (100 - (settings?.commission ?? 0))) / 100),
        buyerNote: telegram ? `Telegram: ${telegram}` : null,
        status: "PENDING",
        deliveryInfo: telegram || product.deliveryInfo,
      },
    });

    const payment = await tx.payment.create({
      data: {
        userId: buyer.id,
        provider: "yoomoney",
        amount: total,
        providerId: `order:${order.id}`,
      },
    });

    return { order, payment };
  });

  const returnUrl = `${appUrl()}/stars?payment=${result.payment.id}`;
  const confirmationUrl = quickpayUrl({
    amount: total / 100,
    label: result.payment.id,
    returnUrl,
  });

  return json({ orderId: result.order.id, paymentId: result.payment.id, confirmationUrl }, 201);
}
