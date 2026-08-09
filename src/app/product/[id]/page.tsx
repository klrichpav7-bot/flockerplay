import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, CheckCircle2, Clock, Flame, KeyRound, MessageCircle, ShieldCheck, Star } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { publicProductSelect } from "@/lib/product-public";
import { BuyPanel } from "@/components/product/buy-panel";
import { ProductCard, type ProductCardData } from "@/components/shared/product-card";
import { VerifiedBadge } from "@/components/shared/verified-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDate, initials, formatPrice, formatNumber } from "@/lib/format";
import { productImages } from "@/lib/product-images";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      ...publicProductSelect,
      category: { select: { id: true, name: true } },
      seller: {
        select: {
          id: true,
          name: true,
          isVerified: true,
          avatarUrl: true,
          about: true,
          createdAt: true,
          _count: { select: { products: { where: { status: "APPROVED" } }, soldOrders: true } },
        },
      },
    },
  });

  const isOwner = session?.user?.id === product?.sellerId;
  const isAdminUser = session?.user?.role === "ROLE_ADMIN";
  if (!product || (product.status !== "APPROVED" && !isOwner && !isAdminUser)) notFound();

  const related = await prisma.product.findMany({
    where: { status: "APPROVED", categoryId: product.categoryId, id: { not: product.id } },
    orderBy: { soldCount: "desc" },
    take: 4,
    select: {
      ...publicProductSelect,
      category: { select: { name: true } },
      seller: { select: { name: true, isVerified: true } },
    },
  });

  const discount = product.oldPrice && product.oldPrice > product.price
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;
  const images = productImages(product.images);

  return (
    <div className="section py-10">
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="transition hover:text-foreground">Главная</Link>
        <span>/</span>
        <Link href="/catalog" className="transition hover:text-foreground">Каталог</Link>
        <span>/</span>
        <Link href={`/catalog?cat=${product.categoryId}`} className="transition hover:text-foreground">{product.category.name}</Link>
      </nav>

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card/60">
            {images[0] ? (
              <img src={images[0]} alt={product.title} className="aspect-[16/9] w-full object-cover" />
            ) : (
              <div className="grid aspect-[16/9] w-full place-items-center bg-gradient-to-br from-sky-600/30 to-violet-600/30">
                <KeyRound className="h-20 w-20 text-white/50" />
              </div>
            )}
            <div className="absolute left-4 top-4 flex gap-2">
              {discount > 0 && <Badge className="bg-rose-500 px-3 py-1 text-white">−{discount}%</Badge>}
              {product.deliveryType === "AUTO" && (
                <Badge variant="secondary" className="bg-black/50 text-white backdrop-blur">Автовыдача</Badge>
              )}
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-border/80 bg-card/60 p-6 sm:p-8">
            <h1 className="font-display text-2xl font-bold sm:text-3xl">{product.title}</h1>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <b className="text-foreground">{product.rating.toFixed(1)}</b> ({product.ratingCount} оценок)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-rose-400" /> {formatNumber(product.soldCount)} продаж
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> {formatDate(product.createdAt)}
              </span>
            </div>

            <div className="my-6 h-px bg-border" />

            <h2 className="text-lg font-semibold">Описание</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{product.description}</p>

            <div className="mt-6 rounded-2xl border border-sky-500/25 bg-sky-500/5 p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-sky-400">
                {product.deliveryType === "AUTO" ? <ZapMini /> : <HandMini />}
                {product.deliveryType === "AUTO" ? "Как получить товар" : "Условия выдачи"}
              </h3>
              <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                {product.deliveryType === "AUTO"
                  ? "Логин, пароль или ключи будут показаны сразу после оплаты на странице заказа — данные видны только покупателю."
                  : "Данные для получения товара продавец передаст покупателю после оплаты."}
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="sticky top-24 space-y-4">
            <div className="rounded-3xl border border-border/80 bg-card/70 p-6">
              <BuyPanel
                productId={product.id}
                title={product.title}
                price={product.price}
                oldPrice={product.oldPrice}
                stock={product.stock}
                image={images[0] ?? ""}
                sellerId={product.sellerId}
                deliveryType={product.deliveryType}
              />
            </div>

            <div className="rounded-3xl border border-border/80 bg-card/70 p-6">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                <ShieldCheck className="h-4 w-4 text-emerald-400" /> Гарантии FlockerPlay
              </h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" /> Списание только после оформления заказа</li>
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" /> Модерация каждого товара</li>
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" /> Поддержка 24/7 на случай споров</li>
              </ul>
            </div>

            <div className="rounded-3xl border border-border/80 bg-card/70 p-6">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={product.seller.avatarUrl ?? undefined} alt={product.seller.name} />
                  <AvatarFallback>{initials(product.seller.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <Link href={`/seller/${product.sellerId}`} className="flex items-center gap-1.5 font-semibold transition hover:text-sky-400">
                    {product.seller.name}
                    {product.seller.isVerified && <VerifiedBadge size="sm" />}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {product.seller._count.soldOrders} продаж · продавец с {formatDate(product.seller.createdAt)}
                  </p>
                </div>
              </div>
              {product.seller.about && (
                <p className="mt-3 text-sm text-muted-foreground">{product.seller.about}</p>
              )}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Link
                  href={`/seller/${product.sellerId}`}
                  className="rounded-xl border border-border bg-card/60 py-2.5 text-center text-sm font-medium transition hover:border-primary/40"
                >
                  Профиль продавца
                </Link>
                <Link
                  href={`/catalog?seller=${product.sellerId}`}
                  className="rounded-xl border border-border bg-card/60 py-2.5 text-center text-sm font-medium transition hover:border-primary/40"
                >
                  Товары продавца
                </Link>
                <Link
                  href={`/dashboard/complaints/new?targetId=${product.sellerId}`}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/25 bg-rose-500/5 py-2.5 text-sm font-medium text-rose-400 transition hover:bg-rose-500/10"
                >
                  <AlertTriangle className="h-4 w-4" /> Жалоба
                </Link>
              </div>
            </div>

            <Link
              href="/support"
              className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card/60 py-3 text-sm font-medium text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
            >
              <MessageCircle className="h-4 w-4" /> Вопрос по товару? Напишите в поддержку
            </Link>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display mb-6 text-2xl font-bold">Похожие товары</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p as unknown as ProductCardData} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ZapMini() {
  return <KeyRound className="h-4 w-4" />;
}
function HandMini() {
  return <MessageCircle className="h-4 w-4" />;
}
