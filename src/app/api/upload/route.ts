import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { auth } from "@/lib/auth";
import { error, json } from "@/lib/api";

const ALLOWED = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"];

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return error("Требуется авторизация", 401);

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File)) return error("Файл не передан", 422);
  if (!ALLOWED.includes(file.type)) return error("Недопустимый формат файла", 422);
  if (file.size > 5 * 1024 * 1024) return error("Файл больше 5 МБ", 422);

  const ext = path.extname(file.name).toLowerCase() || ".png";
  const name = `${crypto.randomBytes(8).toString("hex")}${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, name), buffer);

  return json({ url: `/uploads/${name}` });
}
