import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getOrderChats } from "@/lib/chats";
import { OrderChatsList } from "@/components/orders/order-chats-list";

export const dynamic = "force-dynamic";

export default async function ChatsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const chats = await getOrderChats(session.user.id);

  return (
    <div className="mx-auto max-w-3xl">
      <OrderChatsList initial={chats} userId={session.user.id} />
    </div>
  );
}
