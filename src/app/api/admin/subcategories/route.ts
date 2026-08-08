import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { subcategorySchema } from "@/lib/validations";
import { error, json, isAdmin } from "@/lib/api";

export async function GET() {
  const session = await auth();
  if (!isAdmin(session)) return error("Нет доступа", 403);

  const subcategories = await prisma.subcategory.findMany({
    orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }],
    include: { category: { select: { id: true, name: true, slug: true } } },
  });

  return json({ subcategories });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!isAdmin(session)) return error("Нет доступа", 403);

  const body = await req.json().catch(() => null);
  const parsed = subcategorySchema.safeParse(body);
  if (!parsed.success) return error(parsed.error.issues[0]?.message ?? "Ошибка валидации", 422);

  const exists = await prisma.subcategory.findUnique({
    where: { categoryId_slug: { categoryId: parsed.data.categoryId, slug: parsed.data.slug } },
  });
  if (exists) return error("Такая подкатегория уже существует", 422);

  const subcategory = await prisma.subcategory.create({
    data: {
      categoryId: parsed.data.categoryId,
      name: parsed.data.name,
      slug: parsed.data.slug,
      icon: parsed.data.icon,
      sortOrder: parsed.data.sortOrder,
      active: parsed.data.active ?? true,
    },
  });

  return json({ subcategory }, 201);
}
