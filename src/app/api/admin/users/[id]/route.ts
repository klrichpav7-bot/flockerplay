import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { error, json, isAdmin } from "@/lib/api";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!isAdmin(session)) return error("Нет доступа", 403);

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          products: true,
          orders: true,
          soldOrders: true,
          tickets: true,
          reviewsMade: true,
          reviewsReceived: true,
          complaintsMade: true,
          complaintsOnMe: true,
        },
      },
    },
  });
  if (!user) return error("Пользователь не найден", 404);

  const { passwordHash, ...safe } = user;
  return json({ user: safe });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!isAdmin(session)) return error("Нет доступа", 403);

  if (session?.user?.id && id === session.user.id) {
    return error("Нельзя изменять собственную учётную запись через этот маршрут", 422);
  }

  const body = await req.json().catch(() => ({}));
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return error("Пользователь не найден", 404);

  const data: Record<string, unknown> = {};
  if (typeof body?.isVerified === "boolean") data.isVerified = body.isVerified;
  if (typeof body?.isSeller === "boolean") data.isSeller = body.isSeller;
  if (typeof body?.isBlocked === "boolean") data.isBlocked = body.isBlocked;
  if (body?.role === "ROLE_ADMIN" || body?.role === "ROLE_USER") data.role = body.role;

  const user = await prisma.user.update({ where: { id }, data });

  if (body?.isBlocked === true) {
    await prisma.notification.create({
      data: { userId: id, title: "Аккаунт заблокирован", body: "Обратитесь в поддержку для разблокировки.", type: "info" },
    });
  }

  return json({ user });
}
