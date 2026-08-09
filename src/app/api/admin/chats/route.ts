import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { error, json, isAdmin } from "@/lib/api";
import { productImages } from "@/lib/product-images";

export const dynamic = "force-dynamic";

export interface AdminChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  body: string;
  createdAt: string;
}

export interface AdminChatDto {
  id: string;
  status: string;
  total: number;
  qty: number;
  createdAt: string;
  productTitle: string | null;
  productImage: string | null;
  buyer: { id: string; name: string; avatarUrl: string | null; isVerified: boolean };
  seller: { id: string; name: string; avatarUrl: string | null; isVerified: boolean };
  messages: AdminChatMessage[];
  lastMessage: AdminChatMessage | null;
}

export async function GET() {
  const session = await auth();
  if (!isAdmin(session)) return error("Нет доступа", 403);

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      product: { select: { id: true, title: true, images: true } },
      buyer: { select: { id: true, name: true, avatarUrl: true, isVerified: true } },
      seller: { select: { id: true, name: true, avatarUrl: true, isVerified: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          senderId: true,
          body: true,
          createdAt: true,
          sender: { select: { id: true, name: true } },
        },
      },
    },
  });

  const chats: AdminChatDto[] = orders.map((o) => {
    const messages: AdminChatMessage[] = o.messages.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      senderName: m.sender?.name ?? "Пользователь",
      body: m.body,
      createdAt: m.createdAt.toISOString(),
    }));
    return {
      id: o.id,
      status: o.status,
      total: o.total,
      qty: o.qty,
      createdAt: o.createdAt.toISOString(),
      productTitle: o.product?.title ?? null,
      productImage: productImages(o.product?.images)[0] ?? null,
      buyer: { id: o.buyer.id, name: o.buyer.name, avatarUrl: o.buyer.avatarUrl, isVerified: o.buyer.isVerified },
      seller: { id: o.seller.id, name: o.seller.name, avatarUrl: o.seller.avatarUrl, isVerified: o.seller.isVerified },
      messages,
      lastMessage: messages[messages.length - 1] ?? null,
    };
  });

  chats.sort((a, b) => {
    const at = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : new Date(a.createdAt).getTime();
    const bt = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : new Date(b.createdAt).getTime();
    return bt - at;
  });

  return json({ chats });
}
