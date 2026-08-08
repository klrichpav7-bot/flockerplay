import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { error, json, isAdmin } from "@/lib/api";
import { promoCreateSchema } from "@/lib/validations";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!isAdmin(session)) return error("Нет доступа", 403);

  const body = await req.json().catch(() => null);
  const parsed = promoCreateSchema.partial().safeParse(body);
  if (!parsed.success) return error(parsed.error.issues[0]?.message ?? "Ошибка валидации", 422);

  const data: Record<string, unknown> = {};
  if (parsed.data.code !== undefined) data.code = parsed.data.code.toUpperCase().trim();
  if (parsed.data.type !== undefined) data.type = parsed.data.type;
  if (parsed.data.value !== undefined) data.value = parsed.data.value;
  if (parsed.data.maxUses !== undefined) data.maxUses = parsed.data.maxUses;
  if (parsed.data.active !== undefined) data.active = parsed.data.active;
  if (parsed.data.startsAt !== undefined) data.startsAt = parsed.data.startsAt ? new Date(parsed.data.startsAt) : null;
  if (parsed.data.expiresAt !== undefined) data.expiresAt = parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null;

  if (data.code) {
    const exists = await prisma.promoCode.findFirst({ where: { code: data.code as string, id: { not: id } } });
    if (exists) return error("Промокод с таким кодом уже существует", 409);
  }

  const promo = await prisma.promoCode.update({ where: { id }, data });
  return json({ promo });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!isAdmin(session)) return error("Нет доступа", 403);

  const promo = await prisma.promoCode.findUnique({
    where: { id },
    select: { code: true },
  });
  if (!promo) return error("Промокод не найден", 404);

  await prisma.promoRedemption.deleteMany({ where: { promoId: id } });
  await prisma.user.updateMany({ where: { promoDiscountId: id }, data: { promoDiscountId: null } });
  await prisma.promoCode.delete({ where: { id } });

  return json({ ok: true });
}
