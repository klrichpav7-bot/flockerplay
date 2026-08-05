import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { error, json, isAdmin } from "@/lib/api";

export async function GET(req: Request) {
  const session = await auth();
  if (!isAdmin(session)) return error("Нет доступа", 403);

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  const seller = url.searchParams.get("seller");

  const where: Record<string, unknown> = {};
  if (q) {
    where.OR = [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }];
  }
  if (seller === "true") where.isSeller = true;

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { products: true, orders: true, soldOrders: true } },
    },
  });

  return json({ users });
}
