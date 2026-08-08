import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { subcategorySchema } from "@/lib/validations";
import { error, json, isAdmin } from "@/lib/api";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!isAdmin(session)) return error("Нет доступа", 403);

  const body = await req.json().catch(() => null);
  const parsed = subcategorySchema.partial().safeParse(body);
  if (!parsed.success) return error(parsed.error.issues[0]?.message ?? "Ошибка валидации", 422);

  const data = Object.fromEntries(Object.entries(parsed.data).filter(([, v]) => v !== undefined));

  if (data.slug && data.categoryId) {
    const exists = await prisma.subcategory.findUnique({
      where: { categoryId_slug: { categoryId: data.categoryId as string, slug: data.slug as string } },
    });
    if (exists && exists.id !== id) return error("Такая подкатегория уже существует", 422);
  }

  const subcategory = await prisma.subcategory.update({ where: { id }, data });
  return json({ subcategory });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!isAdmin(session)) return error("Нет доступа", 403);

  const count = await prisma.product.count({ where: { subcategoryId: id } });
  if (count > 0) return error("Сначала перенесите товары из этой подкатегории", 409);

  await prisma.subcategory.delete({ where: { id } });
  return json({ ok: true });
}
