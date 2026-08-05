import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { error, json, isAdmin } from "@/lib/api";

export async function GET() {
  const session = await auth();
  if (!isAdmin(session)) return error("Нет доступа", 403);

  const banners = await prisma.banner.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: { owner: { select: { id: true, name: true } } },
  });

  return json({ banners });
}
