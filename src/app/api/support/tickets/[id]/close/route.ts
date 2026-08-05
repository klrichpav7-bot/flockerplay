import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { error, json, isAdmin } from "@/lib/api";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return error("Требуется авторизация", 401);

  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) return error("Тикет не найден", 404);
  if (ticket.userId !== session.user.id && !isAdmin(session)) return error("Нет доступа", 403);

  const updated = await prisma.ticket.update({
    where: { id },
    data: { status: "CLOSED" },
  });

  return json({ ticket: updated });
}
