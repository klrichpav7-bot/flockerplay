import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { error, json, isAdmin } from "@/lib/api";
import type { BannerStatus } from "@prisma/client";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!isAdmin(session)) return error("Нет доступа", 403);

  const body = await req.json().catch(() => ({}));
  const status = String(body?.status ?? "") as BannerStatus;

  if (!["ACTIVE", "HIDDEN", "PENDING"].includes(status)) return error("Неверный статус", 422);

  const banner = await prisma.banner.update({ where: { id }, data: { status } });
  return json({ banner });
}
