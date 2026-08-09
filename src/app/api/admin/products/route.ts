import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { error, json, isAdmin } from "@/lib/api";
import { productSchema } from "@/lib/validations";
import type { ProductStatus } from "@prisma/client";

export async function GET(req: Request) {
  const session = await auth();
  if (!isAdmin(session)) return error("Нет доступа", 403);

  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? "ALL";

  const where = status === "ALL" ? {} : { status: status as ProductStatus };
  const products = await prisma.product.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      subcategory: { select: { id: true, name: true, slug: true } },
      seller: { select: { id: true, name: true, isVerified: true, avatarUrl: true, balance: true } },
      _count: { select: { orderItems: true } },
    },
  });

  return json({ products });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!isAdmin(session)) return error("Нет доступа", 403);
  if (!session?.user?.id) return error("Нет доступа", 403);

  const body = await req.json().catch(() => null);
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return error(parsed.error.issues[0]?.message ?? "Некорректные данные", 400);
  }
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
      oldPrice: data.oldPrice,
      stock: data.stock,
      deliveryType: data.deliveryType,
      deliveryInfo: data.deliveryInfo,
      images: data.images,
      status: "APPROVED",
      isOfficial: true,
      isFeatured: true,
    },
  });

  return json({ product }, 201);
}
