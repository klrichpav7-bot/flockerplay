import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { adminBannerSchema } from "@/lib/validations";
import { error, json, isAdmin } from "@/lib/api";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!isAdmin(session)) return error("Нет доступа", 403);

  const body = await req.json().catch(() => null);
  const parsed = adminBannerSchema.partial().safeParse(body);
  if (!parsed.success) return error(parsed.error.issues[0]?.message ?? "Ошибка валидации", 422);

  const data = Object.fromEntries(
    Object.entries(parsed.data).filter(([, v]) => v !== undefined)
  );

  const banner = await prisma.banner.update({ where: { id }, data });
  return json({ banner });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!isAdmin(session)) return error("Нет доступа", 403);

  await prisma.banner.delete({ where: { id } });
  return json({ ok: true });
}
