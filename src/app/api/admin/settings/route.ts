import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { error, json, isAdmin } from "@/lib/api";

export async function GET() {
  const session = await auth();
  if (!isAdmin(session)) return error("Нет доступа", 403);

  const settings = await prisma.siteSetting.findUnique({ where: { id: "main" } });
  return json({ settings });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!isAdmin(session)) return error("Нет доступа", 403);

  const body = await req.json().catch(() => ({}));

  const commission = Math.round(Number(body?.commission));
  const minTopUp = Math.round(Number(body?.minTopUp));
  const minWithdrawal = Math.round(Number(body?.minWithdrawal));

  if (!Number.isFinite(commission) || commission < 0 || commission > 100) {
    return error("Комиссия должна быть от 0 до 100%", 422);
  }
  if (!Number.isFinite(minTopUp) || minTopUp < 1) return error("Минимальное пополнение — не меньше 1 ₽", 422);
  if (!Number.isFinite(minWithdrawal) || minWithdrawal < 1) {
    return error("Минимальный вывод — не меньше 1 ₽", 422);
  }

  const starsRate = Math.round(Number(body?.starsRate));
  const starsMin = Math.round(Number(body?.starsMin));
  const starsMax = Math.round(Number(body?.starsMax));
  if (!Number.isFinite(starsRate) || starsRate < 1) return error("Курс звёзд должен быть больше 0", 422);
  if (!Number.isFinite(starsMin) || starsMin < 1) return error("Мин. покупка звёзд — не меньше 1", 422);
  if (!Number.isFinite(starsMax) || starsMax <= starsMin) {
    return error("Максимум звёзд должен быть больше минимума", 422);
  }

  const settings = await prisma.siteSetting.update({
    where: { id: "main" },
    data: {
      commission,
      minTopUp,
      minWithdrawal,
      starsRate,
      starsMin,
      starsMax,
      supportEmail: typeof body?.supportEmail === "string" ? body.supportEmail.trim().slice(0, 120) : undefined,
      telegram: typeof body?.telegram === "string" ? body.telegram.trim().slice(0, 120) : undefined,
      vk: typeof body?.vk === "string" ? body.vk.trim().slice(0, 120) : undefined,
      discord: typeof body?.discord === "string" ? body.discord.trim().slice(0, 120) : undefined,
    },
  });

  return json({ settings });
}
