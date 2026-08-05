import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { error, json } from "@/lib/api";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) return error(parsed.error.issues[0]?.message ?? "Ошибка валидации", 422);

  const { name, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) return error("Пользователь с таким email уже зарегистрирован", 409);

  const user = await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      passwordHash: await bcrypt.hash(password, 10),
    },
  });

  await prisma.notification.create({
    data: {
      userId: user.id,
      title: "Добро пожаловать на FlockerPlay!",
      body: "Пополните баланс и совершите первую покупку.",
      type: "info",
    },
  });

  return json({ ok: true, id: user.id }, 201);
}
