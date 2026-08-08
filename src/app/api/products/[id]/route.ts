import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { publicProductSelect } from "@/lib/product-public";
import { productBaseSchema } from "@/lib/validations";
import { error, json, isAdmin } from "@/lib/api";

async function findProduct(id: string) {
  return prisma.product.findUnique({
    where: { id },
    select: {
      ...publicProductSelect,
      category: { select: { id: true, name: true, slug: true } },
      seller: {
        select: { id: true, name: true, isVerified: true, isSeller: true, avatarUrl: true, about: true, createdAt: true },
      },
    },
  });
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const product = await findProduct(id);
  if (!product) return error("Товар не найден", 404);

  const isOwner = session?.user?.id === product.sellerId;
  const isAdminUser = isAdmin(session);
  if (product.status !== "APPROVED" && !isOwner && !isAdminUser) {
    return error("Товар не найден", 404);
  }

  return json({ product });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return error("Требуется авторизация", 401);

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return error("Товар не найден", 404);
  if (existing.sellerId !== session.user.id && !isAdmin(session)) {
    return error("Нет прав", 403);
  }

  const body = await req.json().catch(() => null);
  const parsed = productBaseSchema.partial().safeParse(body);
  if (!parsed.success) return error(parsed.error.issues[0]?.message ?? "Ошибка валидации", 422);

  const data = parsed.data;
  const product = await prisma.product.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      categoryId: data.categoryId,
      price: data.price,
      oldPrice: data.oldPrice ?? null,
      stock: data.stock,
      deliveryType: data.deliveryType,
      deliveryInfo: data.deliveryInfo,
      status: isAdmin(session) ? existing.status : "PENDING",
    },
  });

  return json({ product });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return error("Требуется авторизация", 401);

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return error("Товар не найден", 404);
  if (existing.sellerId !== session.user.id && !isAdmin(session)) {
    return error("Нет прав", 403);
  }

  await prisma.product.delete({ where: { id } });
  return json({ ok: true });
}
