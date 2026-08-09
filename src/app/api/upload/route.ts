import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import sharp from "sharp";
import { auth } from "@/lib/auth";
import { error, json } from "@/lib/api";

const ALLOWED = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"];
const THUMBNABLE = new Set(["image/png", "image/jpeg", "image/webp"]);

function watermark(width: number, height: number) {
  const size = Math.max(18, Math.round(Math.min(width, height) * 0.05));
  const pad = Math.max(12, Math.round(Math.min(width, height) * 0.04));
  return Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <text x="${width - pad}" y="${height - pad}" text-anchor="end"
        font-family="Segoe UI, system-ui, Arial, sans-serif" font-size="${size}" font-weight="700"
        letter-spacing="1" fill="rgba(255,255,255,0.42)" stroke="rgba(0,0,0,0.28)" stroke-width="0.75">Flocker Play</text>
    </svg>`
  );
}

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

  if (THUMBNABLE.has(file.type)) {
    const originalPath = path.join(dir, name);
    try {
      const base = await sharp(buffer).toBuffer();
      const meta = await sharp(base).metadata();
      await sharp(base)
        .composite([{ input: watermark(meta.width ?? 1000, meta.height ?? 1000) }])
        .toFile(originalPath);
    } catch {
      await writeFile(originalPath, buffer);
    }

    let thumb = `/uploads/${name}`;
    try {
      const thumbName = `${stem}-thumb.webp`;
      const thumbBuffer = await sharp(buffer)
        .resize({ width: 256, height: 256, fit: "inside", withoutEnlargement: true })
        .toBuffer();
      const thumbMeta = await sharp(thumbBuffer).metadata();
      await sharp(thumbBuffer)
        .composite([{ input: watermark(thumbMeta.width ?? 256, thumbMeta.height ?? 256) }])
        .webp({ quality: 80 })
        .toFile(path.join(dir, thumbName));
      thumb = `/uploads/${thumbName}`;
    } catch {
      thumb = `/uploads/${name}`;
    }
    return json({ url: `/uploads/${name}`, thumb });
  }

  await writeFile(path.join(dir, name), buffer);
  return json({ url: `/uploads/${name}`, thumb: `/uploads/${name}` });
}
