import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { error, json, isAdmin } from "@/lib/api";
import { creditPayment } from "@/lib/yoomoney";
import { confirmStarsOrder, rejectStarsOrder } from "@/lib/stars";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!isAdmin(session)) return error("Нет доступа", 403);

  const body = await req.json().catch(() => ({}));
  const action = String(body?.action ?? "").toUpperCase();

  const payment = await prisma.payment.findUnique({ where: { id } });
  if (!payment) return error("Платёж не найден", 404);
  if (payment.status === "SUCCEEDED") return error("Платёж уже зачислен", 409);

  const isStars = payment.providerId?.startsWith("order:");

  if (action === "CONFIRM") {
    const done = isStars ? await confirmStarsOrder(payment.id) : await creditPayment(payment.id);
    if (!done) return error("Не удалось зачислить платёж", 409);
    return json({ ok: true });
  }

  if (action === "REJECT") {
    if (isStars) {
      const done = await rejectStarsOrder(payment.id);
      if (!done) return error("Не удалось отменить платёж", 409);
      return json({ ok: true });
    }
    await prisma.payment.update({ where: { id }, data: { status: "FAILED" } });
    return json({ ok: true });
  }

  return error("Неизвестное действие", 422);
}
