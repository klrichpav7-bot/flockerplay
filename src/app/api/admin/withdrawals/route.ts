import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { error, json, isAdmin } from "@/lib/api";

export async function GET() {
  const session = await auth();
  if (!isAdmin(session)) return error("Нет доступа", 403);

  const withdrawals = await prisma.withdrawal.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: { user: { select: { id: true, name: true, email: true, isVerified: true } } },
  });

  return json({ withdrawals });
}
