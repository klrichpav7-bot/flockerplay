import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { OrderRow, type OrderDto } from "@/components/orders/order-row";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const sp = await searchParams;
  const tab = sp.tab === "seller" ? "seller" : "buyer";

  const orders = await prisma.order.findMany({
    where: tab === "seller" ? { sellerId: session.user.id } : { buyerId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      product: { select: { id: true, title: true, images: true, deliveryType: true } },
      buyer: { select: { id: true, name: true, isVerified: true } },
      seller: { select: { id: true, name: true, isVerified: true } },
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold sm:text-3xl">Мои заказы</h1>

      <div className="inline-flex rounded-2xl border border-border bg-card/60 p-1">
        <TabLink href="/dashboard/orders" active={tab === "buyer"}>Покупки</TabLink>
        <TabLink href="/dashboard/orders?tab=seller" active={tab === "seller"}>Продажи</TabLink>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-3xl border border-border/80 bg-card/60 p-10 text-center">
          <p className="text-lg font-semibold">{tab === "buyer" ? "Пока нет покупок" : "Пока нет продаж"}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {tab === "buyer" ? "Найдите что-нибудь интересное в каталоге." : "Как только кто-то купит ваш товар, он появится здесь."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <OrderRow key={o.id} order={o as unknown as OrderDto} role={tab === "seller" ? "seller" : "buyer"} />
          ))}
        </div>
      )}
    </div>
  );
}

function TabLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className={cn(
        "rounded-xl px-5 py-2 text-sm font-medium transition",
        active ? "bg-primary text-white shadow-lg shadow-primary/25" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </a>
  );
}
