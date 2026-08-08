import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { categorySchema } from "@/lib/validations";
import { error, json, isAdmin } from "@/lib/api";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!isAdmin(session)) return error("Нет доступа", 403);

  const body = await req.json().catch(() => null);
  const parsed = categorySchema.partial().safeParse(body);
  if (!parsed.success) return error(parsed.error.issues[0]?.message ?? "Ошибка валидации", 422);

  const data = Object.fromEntries(Object.entries(parsed.data).filter(([, v]) => v !== undefined));

  if (data.slug) {
    const exists = await prisma.category.findFirst({
      where: { slug: data.slug as string, id: { not: id } },
    });
    if (exists) return error("Такой slug уже занят", 422);
  }

  const category = await prisma.category.update({ where: { id }, data });
  return json({ category });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!isAdmin(session)) return error("Нет доступа", 403);

  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0) return error("Сначала перенесите товары из этого раздела", 409);

  await prisma.subcategory.deleteMany({ where: { categoryId: id } });
  await prisma.category.delete({ where: { id } });
  return json({ ok: true });
}
