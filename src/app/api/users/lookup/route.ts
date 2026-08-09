import { prisma } from "@/lib/prisma";
import { json } from "@/lib/api";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  if (!q || q.length < 2) return json({ users: [] });

  const users = await prisma.user.findMany({
    where: {
      OR: [{ name: { contains: q } }, { email: { contains: q } }],
    },
    select: { id: true, name: true, email: true, isVerified: true, isSeller: true },
    orderBy: { isSeller: "desc" },
    take: 8,
  });

  return json({ users });
}
