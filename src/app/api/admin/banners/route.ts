import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { adminBannerSchema } from "@/lib/validations";
import { error, json, isAdmin } from "@/lib/api";

export async function GET() {
  const session = await auth();
  if (!isAdmin(session)) return error("Нет доступа", 403);

  const banners = await prisma.banner.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: { owner: { select: { id: true, name: true } } },
  });

  return json({ banners });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!isAdmin(session)) return error("Нет доступа", 403);

  const body = await req.json().catch(() => null);
  const parsed = adminBannerSchema.safeParse(body);
  if (!parsed.success) return error(parsed.error.issues[0]?.message ?? "Ошибка валидации", 422);

  const banner = await prisma.banner.create({
    data: {
      ownerId: session?.user?.id ?? "",
      title: parsed.data.title,
      imageUrl: parsed.data.imageUrl,
      linkUrl: parsed.data.linkUrl,
      placement: parsed.data.placement,
      status: parsed.data.status ?? "ACTIVE",
      sortOrder: parsed.data.sortOrder,
      durationMs: parsed.data.durationMs,
    },
  });

  return json({ banner }, 201);
}
