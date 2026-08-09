import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { publicProductSelect } from "@/lib/product-public";
import { productSchema } from "@/lib/validations";
import { error, json } from "@/lib/api";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const cat = url.searchParams.get("cat");
  const q = url.searchParams.get("q")?.trim();
  const sort = url.searchParams.get("sort");
  const sellerId = url.searchParams.get("seller");

  const where: Record<string, unknown> = { status: "APPROVED" };
  if (cat) where.categoryId = cat;
  if (sellerId) where.sellerId = sellerId;
  if (q) {
    where.OR = [{ title: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }];
  }

  const orderBy: Record<string, unknown>[] =
    sort === "popular"
      ? [{ soldCount: "desc" as const }]
      : sort === "price-asc"
        ? [{ price: "asc" as const }]
        : sort === "price-desc"
          ? [{ price: "desc" as const }]
          : sort === "rating"
            ? [{ rating: "desc" as const }]
            : sort === "newest"
              ? [{ createdAt: "desc" as const }]
              : [{ soldCount: "desc" as const }];

  const products = await prisma.product.findMany({
    where,
    orderBy,
    select: {
      ...publicProductSelect,
      category: { select: { name: true, slug: true } },
      seller: { select: { id: true, name: true, isVerified: true, avatarUrl: true } },
    },
  });

  return json({ products });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return error("Требуется авторизация", 401);

  const body = await req.json().catch(() => null);
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) return error(parsed.error.issues[0]?.message ?? "Ошибка валидации", 422);

  const data = parsed.data;

  const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
  if (!category) return error("Категория не найдена", 404);

  const product = await prisma.product.create({
    data: {
      sellerId: session.user.id,
      categoryId: data.categoryId,
      title: data.title,
      description: data.description,
      price: data.price,
      oldPrice: data.oldPrice || null,
      stock: data.stock,
      deliveryType: data.deliveryType,
      deliveryInfo: data.deliveryInfo,
      images: data.images,
      status: "PENDING",
    },
  });

  await prisma.user.update({ where: { id: session.user.id }, data: { isSeller: true } });

  return json({ product }, 201);
}
