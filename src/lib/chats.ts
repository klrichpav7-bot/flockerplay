import { prisma } from "@/lib/prisma";
import { productImages } from "@/lib/product-images";

export interface ChatCounterpart {
  id: string;
  name: string;
  avatarUrl: string | null;
  isVerified: boolean;
}

export interface ChatLastMessage {
  body: string;
  createdAt: string;
  senderId: string;
  senderName: string | null;
}

export interface OrderChatDto {
  id: string;
  status: string;
  total: number;
  qty: number;
  createdAt: string;
  isBuyer: boolean;
  productTitle: string | null;
  productImage: string | null;
  counterpart: ChatCounterpart;
  lastMessage: ChatLastMessage | null;
  unread: number;
}

export async function getOrderChats(userId: string): Promise<OrderChatDto[]> {
  const orders = await prisma.order.findMany({
    where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
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

  const chats: OrderChatDto[] = orders.map((o) => {
    const isBuyer = o.buyerId === userId;
    const lastReadAt = isBuyer ? o.buyerLastReadAt : o.sellerLastReadAt;
    const counterpart = isBuyer ? o.seller : o.buyer;
    const incoming = o.messages.filter((m) => m.senderId !== userId);
    const last = o.messages[o.messages.length - 1] ?? null;

    return {
      id: o.id,
      status: o.status,
      total: o.total,
      qty: o.qty,
      createdAt: o.createdAt.toISOString(),
      isBuyer,
      productTitle: o.product?.title ?? null,
      productImage: productImages(o.product?.images)[0] ?? null,
      counterpart: {
        id: counterpart.id,
        name: counterpart.name,
        avatarUrl: counterpart.avatarUrl,
        isVerified: counterpart.isVerified,
      },
      lastMessage: last
        ? {
            body: last.body,
            createdAt: last.createdAt.toISOString(),
            senderId: last.senderId,
            senderName: last.sender?.name ?? null,
          }
        : null,
      unread: lastReadAt ? incoming.filter((m) => new Date(m.createdAt) > lastReadAt).length : incoming.length,
    };
  });

  chats.sort((a, b) => {
    const at = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : new Date(a.createdAt).getTime();
    const bt = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : new Date(b.createdAt).getTime();
    return bt - at;
  });

  return chats;
}
