import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import sharp from "sharp";
import { auth } from "@/lib/auth";
import { error, json } from "@/lib/api";

const ALLOWED = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"];
const THUMBNABLE = new Set(["image/png", "image/jpeg", "image/webp"]);

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return error("Требуется авторизация", 401);

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File)) return error("Файл не передан", 422);
  if (!ALLOWED.includes(file.type)) return error("Недопустимый формат файла", 422);
  if (file.size > 5 * 1024 * 1024) return error("Файл больше 5 МБ", 422);

  const ext = path.extname(file.name).toLowerCase() || ".png";
  const stem = crypto.randomBytes(8).toString("hex");
  const name = `${stem}${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, name), buffer);

  let thumb = `/uploads/${name}`;
  if (THUMBNABLE.has(file.type)) {
    try {
      const thumbName = `${stem}-thumb.webp`;
      await sharp(buffer)
        .resize({ width: 256, height: 256, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(path.join(dir, thumbName));
      thumb = `/uploads/${thumbName}`;
    } catch {
      thumb = `/uploads/${name}`;
    }
  }

  return json({ url: `/uploads/${name}`, thumb });
}
