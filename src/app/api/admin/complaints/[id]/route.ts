import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { error, json, isAdmin } from "@/lib/api";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!isAdmin(session)) return error("Нет доступа", 403);

  const body = await req.json().catch(() => ({}));
  const action = String(body?.action ?? "").toUpperCase();
  const adminNote = String(body?.adminNote ?? "").trim();

  const complaint = await prisma.complaint.findUnique({ where: { id } });
  if (!complaint) return error("Жалоба не найдена", 404);
  if (complaint.status !== "PENDING") return error("Жалоба уже рассмотрена", 409);

  if (action !== "RESOLVE" && action !== "DISMISS") return error("Неизвестное действие", 422);

  const updated = await prisma.complaint.update({
    where: { id },
    data: { status: action === "RESOLVE" ? "RESOLVED" : "DISMISSED", adminNote },
  });

  await prisma.notification.create({
    data: {
      userId: complaint.reporterId,
      title: action === "RESOLVE" ? "Жалоба рассмотрена" : "Жалоба отклонена",
      body: adminNote || "Решение принято администратором.",
      type: "complaint",
    },
  });

  return json({ complaint: updated });
}
