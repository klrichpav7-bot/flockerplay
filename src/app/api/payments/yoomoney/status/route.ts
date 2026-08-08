import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { error, json } from "@/lib/api";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return error("Требуется авторизация", 401);

  const url = new URL(req.url);
  const paymentId = url.searchParams.get("paymentId");
  if (!paymentId) return error("Не указан платёж", 422);

  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.userId !== session.user.id) return error("Платёж не найден", 404);

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });

  return json({ status: payment.status, newBalance: user?.balance ?? 0 });
}
