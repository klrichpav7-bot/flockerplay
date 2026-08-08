import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { error, json } from "@/lib/api";
import type { OrderStatus, Prisma } from "@prisma/client";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return error("Требуется авторизация", 401);

  const url = new URL(req.url);
  const role = url.searchParams.get("role") ?? "buyer";
  const status = url.searchParams.get("status");

  const where: Prisma.OrderWhereInput = {
    ...(role === "seller" ? { sellerId: session.user.id } : { buyerId: session.user.id }),
    ...(status ? { status: status as OrderStatus } : {}),
  };

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      product: { select: { id: true, title: true, images: true, deliveryType: true } },
      buyer: { select: { id: true, name: true, isVerified: true } },
      seller: { select: { id: true, name: true, isVerified: true } },
      review: { select: { rating: true, comment: true } },
    },
  });

  return json({ orders });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return error("Требуется авторизация", 401);

  const body = await req.json().catch(() => null);
  let items: { productId: string; qty: number }[] = [];
  let buyerNote: string | undefined;

  if (Array.isArray(body?.items) && body.items.length > 0) {
    items = body.items;
    buyerNote = body.buyerNote;
  } else if (body?.productId) {
    items = [{ productId: body.productId, qty: body.qty || 1 }];
    buyerNote = body.buyerNote;
  }
  if (items.length === 0) return error("Корзина пуста", 422);
  if (items.length > 20) return error("Слишком много товаров в заказе", 422);

  const productIds = [...new Set(items.map((i) => i.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, status: "APPROVED" },
    include: { seller: { select: { id: true, name: true } } },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  const normalized = items.map((item) => {
    const product = productMap.get(item.productId);
    if (!product) throw new Error(`Товар не найден: ${item.productId}`);
    return { product, qty: Math.max(1, Math.min(item.qty || 1, 99)) };
  });

  for (const { product, qty } of normalized) {
    if (product.stock > 0 && product.stock < qty) {
      return error(`Недостаточно товара «${product.title}» в наличии`, 409);
    }
    if (product.sellerId === session.user.id) {
      return error("Нельзя купить собственный товар", 422);
    }
  }

  const total = normalized.reduce((s, { product, qty }) => s + product.price * qty, 0);
  const userId = session.user.id;

  const buyer = await prisma.user.findUnique({ where: { id: userId } });
  if (!buyer) return error("Пользователь не найден", 404);

  let discountPct = 0;
  let promoCode: string | null = null;
  if (buyer.promoDiscountId) {
    const promo = await prisma.promoCode.findUnique({ where: { id: buyer.promoDiscountId } });
    const valid =
      promo &&
      promo.active &&
      promo.type === "DISCOUNT" &&
      (!promo.startsAt || new Date() >= promo.startsAt) &&
      (!promo.expiresAt || new Date() <= promo.expiresAt);
    if (valid) {
      discountPct = Math.min(promo.value, 90);
      promoCode = promo.code;
    } else {
      await prisma.user.update({ where: { id: userId }, data: { promoDiscountId: null } });
    }
  }

  const lines = normalized.map(({ product, qty }) => {
    const full = product.price * qty;
    const final = discountPct > 0 ? Math.round((full * (100 - discountPct)) / 100) : full;
    return { product, qty, full, final };
  });

  const charged = lines.reduce((s, l) => s + l.final, 0);
  const discountAmount = total - charged;

  if (buyer.balance < charged) {
    return error(`Недостаточно средств. Нужно ${charged.toLocaleString("ru-RU")} ₽`, 402);
  }

  const settings = await prisma.siteSetting.findUnique({ where: { id: "main" } });
  const commission = settings?.commission ?? 0;

  const result = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        balance: { decrement: charged },
        ...(discountPct > 0 ? { promoDiscountId: null } : {}),
      },
    });
    await tx.balanceTransaction.create({
      data: {
        userId,
        type: "PURCHASE",
        amount: -charged,
        reason:
          discountPct > 0
            ? `Покупка товаров (${normalized.length} шт., скидка ${discountPct}%)`
            : `Покупка товаров (${normalized.length} шт.)`,
      },
    });

    const createdOrders = [];

    for (const { product, qty, final } of lines) {
      const isAuto = product.deliveryType === "AUTO";
      const sellerAmount = Math.round((product.price * qty * (100 - commission)) / 100);

      if (product.stock > 0) {
        await tx.product.update({ where: { id: product.id }, data: { stock: { decrement: qty } } });
      }
      await tx.product.update({ where: { id: product.id }, data: { soldCount: { increment: qty } } });

      const order = await tx.order.create({
        data: {
          buyerId: userId,
          sellerId: product.sellerId,
          productId: product.id,
          total: final,
          qty,
          sellerAmount,
          buyerNote,
          status: isAuto ? "DELIVERED" : "PAID",
          deliveryInfo: product.deliveryInfo,
          deliveredAt: isAuto ? new Date() : null,
        },
      });

      createdOrders.push(order);
    }

    await tx.notification.create({
      data: {
        userId,
        title: "Заказ оформлен",
        body: `Списано ${charged.toLocaleString("ru-RU")} ₽. Заказ №${createdOrders[0]?.id ?? ""}`,
        type: "order",
      },
    });
    await tx.notification.createMany({
      data: normalized.map(({ product, qty }) => ({
        userId: product.sellerId,
        title: "Новый заказ",
        body: `${product.title} ×${qty} на ${(product.price * qty).toLocaleString("ru-RU")} ₽. Средства зачислятся после подтверждения сделки покупателем.`,
        type: "order",
      })),
    });

    const newBuyer = await tx.user.findUnique({ where: { id: userId } });
    return { orders: createdOrders, newBalance: newBuyer?.balance ?? 0 };
  });

  return json({ orders: result.orders, newBalance: result.newBalance, total: charged }, 201);
}
