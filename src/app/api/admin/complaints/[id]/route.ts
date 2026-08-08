import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { error, json, isAdmin } from "@/lib/api";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!isAdmin(session)) return error("Нет доступа", 403);

  const body = await req.json().catch(() => ({}));
  const action = String(body?.action ?? "").toUpperCase();
  const adminNote = String(body?.adminNote ?? "").trim();

  const complaint = await prisma.complaint.findUnique({ where: { id } });
  if (!complaint) return error("Жалоба не найдена", 404);
  if (complaint.status !== "PENDING") return error("Жалоба уже рассмотрена", 409);

  if (!["RESOLVE", "DISMISS", "REFUND"].includes(action)) return error("Неизвестное действие", 422);

  if (action === "REFUND") {
    if (!complaint.orderId) return error("Жалоба не привязана к заказу — возврат невозможен", 422);

    const order = await prisma.order.findUnique({ where: { id: complaint.orderId } });
    if (!order) return error("Заказ не найден", 404);

    await prisma.$transaction(async (tx) => {
      // Возврат покупателю полной суммы
      await tx.user.update({ where: { id: order.buyerId }, data: { balance: { increment: order.total } } });
      await tx.balanceTransaction.create({
        data: {
          userId: order.buyerId,
          type: "ADMIN",
          amount: order.total,
          reason: `Возврат по жалобе №${complaint.id.slice(0, 8)}`,
        },
      });

      // Если продавец уже получил выплату — списываем назад
      if (order.status === "COMPLETED" || order.status === "DELIVERED") {
        await tx.user.update({
          where: { id: order.sellerId },
          data: { balance: { decrement: order.sellerAmount } },
        });
        await tx.balanceTransaction.create({
          data: {
            userId: order.sellerId,
            type: "ADMIN",
            amount: -order.sellerAmount,
            reason: `Возврат покупателю по жалобе №${complaint.id.slice(0, 8)}`,
          },
        });
        await tx.notification.create({
          data: {
            userId: order.sellerId,
            title: "Возврат по спору",
            body: `Администрация вернула покупателю средства по заказу №${order.id.slice(0, 8)}.`,
            type: "complaint",
          },
        });
      }

      await tx.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED", fundsReleasedAt: new Date() },
      });

      await tx.orderMessage.create({
        data: {
          orderId: order.id,
          senderId: session?.user?.id ?? "",
          body: `🛡️ [Система] Администрация рассмотрела спор и вернула покупателю ${(order.total / 100).toLocaleString("ru-RU")} ₽. Заказ отменён.`,
        },
      });

      await tx.complaint.update({
        where: { id },
        data: { status: "RESOLVED", adminNote: adminNote || "Возврат средств покупателю выполнен." },
      });

      await tx.notification.create({
        data: {
          userId: complaint.reporterId,
          title: "Возврат выполнен",
          body: adminNote || `Администрация вернула вам ${(order.total / 100).toLocaleString("ru-RU")} ₽ по заказу №${order.id.slice(0, 8)}.`,
          type: "complaint",
        },
      });
    });

    return json({ ok: true });
  }

  const updated = await prisma.complaint.update({
    where: { id },
    data: { status: action === "RESOLVE" ? "RESOLVED" : "DISMISSED", adminNote },
  });

  await prisma.notification.create({
    data: {
      userId: complaint.reporterId,
      title: action === "RESOLVE" ? "Жалоба рассмотрена" : "Жалоба отклонена",
      body: adminNote || "Решение принято администратором.",
      type: "complaint",
    },
  });

  return json({ complaint: updated });
}
