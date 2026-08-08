import { auth } from "@/lib/auth";
import { getOrderChats } from "@/lib/chats";
import { error, json } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return error("Требуется авторизация", 401);
  const chats = await getOrderChats(session.user.id);
  return json({ chats });
}
