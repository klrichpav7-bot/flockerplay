import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { error, json, isAdmin } from "@/lib/api";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!isAdmin(session)) return error("Нет доступа", 403);

  const body = await req.json().catch(() => ({}));
  const status = String(body?.status ?? "");
  const isFeatured = body?.isFeatured;

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return error("Товар не найден", 404);

  const data: Record<string, unknown> = {};
  if (["APPROVED", "HIDDEN", "PENDING", "REJECTED"].includes(status)) data.status = status;
  if (typeof isFeatured === "boolean") data.isFeatured = isFeatured;

  const product = await prisma.product.update({ where: { id }, data });

  await prisma.notification.create({
    data: {
      userId: existing.sellerId,
      title:
        status === "APPROVED"
          ? "Товар опубликован"
          : status === "REJECTED"
            ? "Товар отклонён"
            : status === "HIDDEN"
              ? "Товар скрыт"
              : "Товар отправлен на доработку",
      body: `«${existing.title}»`,
      type: "order",
    },
  });

  return json({ product });
}
