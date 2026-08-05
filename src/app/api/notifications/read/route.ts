import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { error, json } from "@/lib/api";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return error("Требуется авторизация", 401);

  await prisma.notification.updateMany({
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true },
  });

  return json({ ok: true });
}
