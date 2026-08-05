import { prisma } from "@/lib/prisma";
import { bannerSchema } from "@/lib/validations";
import { auth } from "@/lib/auth";
import { error, json } from "@/lib/api";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const placement = url.searchParams.get("placement") ?? "HOME";

  const banners = await prisma.banner.findMany({
    where: {
      status: "ACTIVE",
      placement,
      OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
    },
    orderBy: { sortOrder: "asc" },
  });

  return json({ banners });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return error("Требуется авторизация", 401);

  const body = await req.json().catch(() => null);
  const parsed = bannerSchema.safeParse(body);
  if (!parsed.success) return error(parsed.error.issues[0]?.message ?? "Ошибка валидации", 422);

  const banner = await prisma.banner.create({
    data: {
      ownerId: session.user.id,
      title: parsed.data.title,
      imageUrl: parsed.data.imageUrl,
      linkUrl: parsed.data.linkUrl,
      placement: parsed.data.placement,
      status: "PENDING",
    },
  });

  const admins = await prisma.user.findMany({ where: { role: "ROLE_ADMIN" }, select: { id: true } });
  await prisma.notification.createMany({
    data: admins.map((a) => ({
      userId: a.id,
      title: "Новый баннер на модерацию",
      body: `${session.user.name}: «${parsed.data.title}»`,
      type: "info",
    })),
  });

  return json({ banner }, 201);
}
