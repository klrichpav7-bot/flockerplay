import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { error, json, isAdmin } from "@/lib/api";

export async function GET() {
  const session = await auth();
  if (!isAdmin(session)) return error("Нет доступа", 403);

  const complaints = await prisma.complaint.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      reason: true,
      text: true,
      status: true,
      adminNote: true,
      createdAt: true,
      orderId: true,
      reporter: { select: { id: true, name: true } },
      target: { select: { id: true, name: true, isVerified: true } },
    },
  });

  return json({ complaints });
}
