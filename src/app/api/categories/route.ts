import { prisma } from "@/lib/prisma";
import { json } from "@/lib/api";

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: { where: { status: "APPROVED" } } } } },
  });
  return json({ categories });
}
