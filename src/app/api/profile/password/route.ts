import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { error, json } from "@/lib/api";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return error("Требуется авторизация", 401);

  const body = await req.json().catch(() => null);
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

  if (newPassword.length < 6) return error("Пароль должен быть не короче 6 символов", 422);
  if (newPassword.length > 100) return error("Максимум 100 символов", 422);

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return error("Пользователь не найден", 404);

  if (!user.googleId) {
    if (!currentPassword) return error("Введите текущий пароль", 422);
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return error("Текущий пароль неверен", 400);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(newPassword, 10) },
  });

  return json({ ok: true });
}
