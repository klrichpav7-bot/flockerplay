import { prisma } from "@/lib/prisma";
import { json } from "@/lib/api";

export async function GET() {
  const banner = await prisma.banner.findFirst({
    where: { status: "ACTIVE", placement: "TOP", OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }] },
    orderBy: { sortOrder: "asc" },
    select: { id: true, title: true, imageUrl: true, linkUrl: true },
  });

  return json({ banner });
}
