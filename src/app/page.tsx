import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { publicProductSelect } from "@/lib/product-public";
import { ProductCard, type ProductCardData } from "@/components/shared/product-card";
import { HeroSearch } from "@/components/home/hero-search";
import { BannerSlider } from "@/components/home/banner-slider";
import { GameCarousel } from "@/components/home/game-carousel";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ShieldCheck, Timer, Wallet, Zap } from "lucide-react";
import { formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, featured, popular, official, banners] = await Promise.all([
    prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { products: { where: { status: "APPROVED" } } } } },
    }),
    prisma.product.findMany({
      where: { status: "APPROVED", isFeatured: true },
      orderBy: { soldCount: "desc" },
      take: 8,
      select: {
        ...publicProductSelect,
        category: { select: { name: true } },
        seller: { select: { name: true, isVerified: true } },
      },
    }),
    prisma.product.findMany({
      where: { status: "APPROVED" },
      orderBy: { soldCount: "desc" },
      take: 8,
      select: {
        ...publicProductSelect,
        category: { select: { name: true } },
        seller: { select: { name: true, isVerified: true } },
      },
    }),
    prisma.product.findMany({
      where: { status: "APPROVED", isOfficial: true },
      orderBy: { soldCount: "desc" },
      take: 4,
      select: {
        ...publicProductSelect,
        category: { select: { name: true } },
        seller: { select: { name: true, isVerified: true } },
      },
    }),
    prisma.banner.findMany({
      where: { status: "ACTIVE", placement: "HOME", OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }] },
      orderBy: { sortOrder: "asc" },
      select: { id: true, title: true, imageUrl: true, linkUrl: true, durationMs: true },
    }),
  ]);

  const sellersCount = await prisma.user.count({ where: { isSeller: true } });
  const totalSold = await prisma.product.aggregate({ _sum: { soldCount: true } });
  const totalUsers = await prisma.user.count();

  return (
    <div className="pb-20">
      {/* HERO */}
      <section className="section relative pt-16 pb-14 sm:pt-24 sm:pb-20">
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <Badge variant="secondary" className="border-primary/30 bg-primary/10 px-4 py-1.5 text-primary">
            <Zap className="h-3.5 w-3.5" /> Мгновенная доставка цифровых товаров
          </Badge>
          <h1 className="font-display mt-6 text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
            Игровой маркетплейс
            <span className="text-gradient block">товаров и услуг</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Ключи, внутриигровая валюта, буст, донаты и подарочные карты от проверенных продавцов. Безопасные сделки
            и пополнение баланса за пару кликов.
          </p>
          <div className="mt-8">
            <HeroSearch />
          </div>

          <div className="mt-10 grid grid-cols-3 gap-3 sm:gap-6">
            {[
              { value: `${formatNumber(totalSold._sum.soldCount ?? 0)}+`, label: "продаж" },
              { value: `${formatNumber(sellersCount)}`, label: "продавцов" },
              { value: `${formatNumber(totalUsers)}`, label: "игроков" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-border/60 bg-card/50 px-3 py-4">
                <p className="font-display text-2xl font-bold text-gradient sm:text-3xl">{s.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="pointer-events-none absolute -top-10 left-1/2 z-0 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-indigo-600/25 blur-[100px]" />
      </section>

      {/* BANNERS */}
      {banners.length > 0 && (
        <section className="section mb-14">
          <BannerSlider banners={banners} />
        </section>
      )}

      {/* CATEGORIES */}
      <section className="section mb-16">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Популярные игры</h2>
          <Link href="/catalog" className="inline-flex items-center gap-1 text-sm font-medium text-sky-400 transition hover:text-sky-300">
            Весь каталог <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <GameCarousel items={categories.map((c) => ({ id: c.id, name: c.name, icon: c.icon, slug: c.slug }))} />
      </section>

      {/* OFFICIAL */}
      {official.length > 0 && (
        <section className="section mb-16">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="font-display flex items-center gap-2 text-2xl font-bold sm:text-3xl">
              <ShieldCheck className="h-6 w-6 text-sky-400" /> Официальные предложения
            </h2>
            <Link href="/catalog?sort=popular" className="inline-flex items-center gap-1 text-sm font-medium text-sky-400 transition hover:text-sky-300">
              Смотреть все <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {official.map((p) => (
              <ProductCard key={p.id} product={p as unknown as ProductCardData} />
            ))}
          </div>
        </section>
      )}

      {/* FEATURED */}
      {featured.length > 0 && (
        <section className="section mb-16">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Рекомендуем</h2>
            <Link href="/catalog" className="inline-flex items-center gap-1 text-sm font-medium text-sky-400 transition hover:text-sky-300">
              Весь каталог <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p as unknown as ProductCardData} />
            ))}
          </div>
        </section>
      )}

      {/* TOP */}
      {popular.length > 0 && (
        <section className="section mb-16">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Топ продаж</h2>
            <Link href="/catalog?sort=popular" className="inline-flex items-center gap-1 text-sm font-medium text-sky-400 transition hover:text-sky-300">
              Смотреть все <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {popular.map((p) => (
              <ProductCard key={p.id} product={p as unknown as ProductCardData} />
            ))}
          </div>
        </section>
      )}

      {/* HOW IT WORKS */}
      <section className="section mb-16">
        <h2 className="font-display mb-8 text-center text-2xl font-bold sm:text-3xl">Как это работает</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: Wallet, title: "Пополните баланс", text: "Создайте заявку на пополнение — админ подтвердит её в течение нескольких минут." },
            { icon: Timer, title: "Выберите товар", text: "Найдите нужный ключ, валюту или услугу в каталоге. Автоматическая выдача — за секунды." },
            { icon: ShieldCheck, title: "Получите гарантии", text: "Безопасные сделки: средства уходят продавцу только после доставки товара." },
          ].map((s) => (
            <div key={s.title} className="glass-card p-7">
              <span className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-sky-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30">
                <s.icon className="h-6 w-6" />
              </span>
              <h3 className="text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SELLER CTA */}
      <section className="section">
        <div className="relative overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-br from-sky-600/20 via-indigo-600/15 to-violet-600/20 p-8 text-center sm:p-14">
          <div className="mesh-blob left-[-5%] top-[-40%] h-64 w-64 bg-sky-500/40" />
          <div className="mesh-blob bottom-[-40%] right-[-5%] h-64 w-64 bg-violet-600/40" />
          <div className="relative">
            <h2 className="font-display text-2xl font-bold sm:text-4xl">Продавайте вместе с FlockerPlay</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
              Размещайте товары, получайте заказы и управляйте продажами. Верифицированные продавцы получают значок
              доверия и больше заказов.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link href="/dashboard/products/new" className="btn-primary-gradient px-7 py-3 text-sm font-semibold">
                Добавить товар
              </Link>
              <Link
                href="/dashboard/sales"
                className="rounded-full border border-border bg-card/60 px-7 py-3 text-sm font-semibold transition hover:border-primary/50"
              >
                Личный кабинет продавца
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
