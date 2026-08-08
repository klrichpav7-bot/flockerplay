import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { categorySchema } from "@/lib/validations";
import { error, json, isAdmin } from "@/lib/api";

export async function GET() {
  const session = await auth();
  if (!isAdmin(session)) return error("Нет доступа", 403);

  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: true, subcategories: true } } },
  });

  return json({ categories });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!isAdmin(session)) return error("Нет доступа", 403);

  const body = await req.json().catch(() => null);
  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) return error(parsed.error.issues[0]?.message ?? "Ошибка валидации", 422);

  const exists = await prisma.category.findUnique({ where: { slug: parsed.data.slug } });
  if (exists) return error("Такой slug уже занят", 422);

  const category = await prisma.category.create({
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      icon: parsed.data.icon,
      accent: parsed.data.accent,
      sortOrder: parsed.data.sortOrder,
      active: parsed.data.active ?? true,
      featured: parsed.data.featured ?? false,
    },
  });

  return json({ category }, 201);
}
