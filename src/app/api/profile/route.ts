import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { error, json } from "@/lib/api";

const AVATAR_RE = /^(https?:\/\/|\/uploads\/|\/images\/|\/avatars\/|data:image\/)/;

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return error("Требуется авторизация", 401);

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : null;
  const avatarUrl = typeof body?.avatarUrl === "string" ? body.avatarUrl : undefined;

  const data: Record<string, unknown> = {};
  if (name !== null) {
    if (name.length < 2) return error("Никнейм должен быть не короче 2 символов", 422);
    if (name.length > 50) return error("Максимум 50 символов", 422);
    const taken = await prisma.user.findFirst({
      where: { name: { equals: name }, id: { not: session.user.id } },
      select: { id: true },
    });
    if (taken) return error("Такой никнейм уже занят — выберите другой", 409);
    data.name = name;
  }
  if (avatarUrl !== undefined) {
    if (avatarUrl && (avatarUrl.length > 500 || !AVATAR_RE.test(avatarUrl))) {
      return error("Недопустимая ссылка на аватар", 422);
    }
    data.avatarUrl = avatarUrl || null;
  }

  if (Object.keys(data).length === 0) return error("Нет данных для обновления", 422);

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data,
    select: { id: true, name: true, email: true, avatarUrl: true },
  });

  return json({ user });
}
