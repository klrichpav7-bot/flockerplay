import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageSquareQuote, Package, ShoppingBag, Star, Store } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { publicProductSelect } from "@/lib/product-public";
import { ProductCard, type ProductCardData } from "@/components/shared/product-card";
import { VerifiedBadge } from "@/components/shared/verified-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDate, formatNumber, initials } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function SellerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const seller = await prisma.user.findUnique({
    where: { id },
    include: {
      _count: { select: { soldOrders: true } },
      products: {
        where: { status: "APPROVED" },
        orderBy: { soldCount: "desc" },
        select: {
          ...publicProductSelect,
          category: { select: { name: true } },
        },
      },
      reviewsReceived: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { buyer: { select: { id: true, name: true, avatarUrl: true, isVerified: true } } },
      },
    },
  });

  if (!seller) notFound();

  const soldCount = seller._count.soldOrders;
  const reviews = seller.reviewsReceived;
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "—";
  const ratingCount = reviews.length;

  return (
    <div className="section py-10">
      <div className="mx-auto max-w-5xl space-y-10">
        <div className="rounded-3xl border border-border/80 bg-card/60 p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-5">
            <Avatar className="h-20 w-20">
              <AvatarImage src={seller.avatarUrl ?? undefined} />
              <AvatarFallback className="text-xl">{initials(seller.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h1 className="flex items-center gap-2 font-display text-2xl font-bold">
                <Store className="h-5 w-5 text-sky-400" />
                {seller.name}
                {seller.isVerified && <VerifiedBadge size="sm" />}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">Продавец с {formatDate(seller.createdAt)}</p>
            </div>
            <div className="flex flex-wrap gap-3 text-center">
              <Stat label="Продаж" value={formatNumber(soldCount)} />
              <Stat label="Товаров" value={formatNumber(seller.products.length)} />
              <Stat label="Рейтинг" value={avgRating} />
              <Stat label="Отзывов" value={formatNumber(ratingCount)} />
            </div>
          </div>
          {seller.about && <p className="mt-5 rounded-2xl bg-muted/40 px-4 py-3 text-sm text-muted-foreground">{seller.about}</p>}
        </div>

        <section>
          <h2 className="font-display mb-5 flex items-center gap-2 text-xl font-bold">
            <Package className="h-5 w-5 text-emerald-400" /> Товары продавца
          </h2>
          {seller.products.length === 0 ? (
            <p className="rounded-3xl border border-border/80 bg-card/60 py-14 text-center text-sm text-muted-foreground">
              У продавца пока нет товаров в каталоге
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {seller.products.map((p) => (
                <ProductCard key={p.id} product={p as unknown as ProductCardData} />
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="font-display mb-5 flex items-center gap-2 text-xl font-bold">
            <MessageSquareQuote className="h-5 w-5 text-amber-400" /> Отзывы покупателей
          </h2>
          {reviews.length === 0 ? (
            <p className="rounded-3xl border border-border/80 bg-card/60 py-14 text-center text-sm text-muted-foreground">
              Отзывов пока нет — станьте первым, кто оценит этого продавца!
            </p>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {reviews.map((r) => (
                <div key={r.id} className="rounded-3xl border border-border/80 bg-card/60 p-5">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={r.buyer.avatarUrl ?? undefined} />
                      <AvatarFallback className="text-[11px]">{initials(r.buyer.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 text-sm font-semibold">
                        {r.buyer.name}
                        {r.buyer.isVerified && <VerifiedBadge size="xs" />}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-400">
                      <Star className="h-3 w-3 fill-current" /> {r.rating}
                    </span>
                  </div>
                  {r.comment && <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">«{r.comment}»</p>}
                  {r.productId && (
                    <Link
                      href={`/product/${r.productId}`}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-border bg-card/60 px-3 py-1.5 text-xs text-sky-400 transition hover:border-sky-500/40"
                    >
                      <ShoppingBag className="h-3.5 w-3.5" /> Товар
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[5.5rem] rounded-2xl border border-border/60 bg-card/60 px-4 py-3">
      <p className="font-display text-lg font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
