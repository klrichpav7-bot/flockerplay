import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { error, json, isAdmin } from "@/lib/api";
import { promoCreateSchema } from "@/lib/validations";

export async function GET() {
  const session = await auth();
  if (!isAdmin(session)) return error("Нет доступа", 403);

  const promos = await prisma.promoCode.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { redemptions: true } } },
  });

  return json({ promos });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!isAdmin(session)) return error("Нет доступа", 403);

  const body = await req.json().catch(() => null);
  const parsed = promoCreateSchema.safeParse(body);
  if (!parsed.success) return error(parsed.error.issues[0]?.message ?? "Ошибка валидации", 422);

  const code = parsed.data.code.toUpperCase().trim();
  const exists = await prisma.promoCode.findUnique({ where: { code } });
  if (exists) return error("Промокод с таким кодом уже существует", 409);

  const promo = await prisma.promoCode.create({
    data: {
      code,
      type: parsed.data.type,
      value: parsed.data.value,
      maxUses: parsed.data.maxUses ?? 0,
      startsAt: parsed.data.startsAt ? new Date(parsed.data.startsAt) : null,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
      active: parsed.data.active ?? true,
    },
  });

  return json({ promo }, 201);
}
