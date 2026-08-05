import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { error, json, isAdmin } from "@/lib/api";
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
      category: { select: { name: true } },
      seller: { select: { id: true, name: true, isVerified: true } },
    },
  });

  return json({ products });
}
