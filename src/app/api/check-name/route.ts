import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { json } from "@/lib/api";

export async function GET(req: Request) {
  const session = await auth();
  const url = new URL(req.url);
  const name = url.searchParams.get("name")?.trim() ?? "";

  if (name.length < 2 || name.length > 50) {
    return json({ available: true, taken: false, valid: false });
  }

  const existing = await prisma.user.findFirst({
    where: {
      name: { equals: name },
      ...(session?.user?.id ? { id: { not: session.user.id } } : {}),
    },
    select: { id: true },
  });

  return json({ available: !existing, taken: !!existing, valid: true });
}
