import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { publicProductSelect } from "@/lib/product-public";
import { ProductCard, type ProductCardData } from "@/components/shared/product-card";
import { CatalogFilterBar } from "@/components/catalog/catalog-filter-bar";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SortKey = "popular" | "newest" | "price-asc" | "price-desc" | "rating";

export default async function CatalogPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const cat = typeof sp.cat === "string" ? sp.cat : undefined;
  const sub = typeof sp.sub === "string" ? sp.sub : undefined;
  const q = typeof sp.q === "string" ? sp.q.trim() : undefined;
  const sort = (typeof sp.sort === "string" ? sp.sort : "") as SortKey;

  const [categories, subcategories, products] = await Promise.all([
    prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { products: { where: { status: "APPROVED" } } } } },
    }),
    cat
      ? prisma.subcategory.findMany({
          where: { categoryId: cat, active: true },
          orderBy: { sortOrder: "asc" },
          include: { _count: { select: { products: { where: { status: "APPROVED" } } } } },
        })
      : [],
    prisma.product.findMany({
      where: {
        status: "APPROVED",
        ...(cat ? { categoryId: cat } : {}),
        ...(sub ? { subcategoryId: sub } : {}),
        ...(q ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }] } : {}),
      },
      orderBy:
        sort === "price-asc"
          ? { price: "asc" }
          : sort === "price-desc"
            ? { price: "desc" }
            : sort === "rating"
              ? [{ isOfficial: "desc" }, { rating: "desc" }]
              : sort === "newest"
                ? { createdAt: "desc" }
                : [{ isOfficial: "desc" }, { soldCount: "desc" }],
      select: {
        ...publicProductSelect,
        category: { select: { name: true } },
        seller: { select: { name: true, isVerified: true } },
      },
    }),
  ]);

  function href(params: Record<string, string | undefined>) {
    const search = new URLSearchParams();
    const merged = { cat, q, sort: sort || undefined, sub, ...params };
    for (const [k, v] of Object.entries(merged)) {
      if (v) search.set(k, v);
    }
    const s = search.toString();
    return s ? `/catalog?${s}` : "/catalog";
  }

  return (
    <div className="section py-10">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold">Каталог</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {q ? `Результаты по запросу «${q}» · ` : ""}
          {products.length} {plural(products.length)}
        </p>
      </div>

      <CatalogFilterBar />

      <div className="mt-6 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        <Link
          href={href({ cat: undefined, sub: undefined })}
          className={cn(
            "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition",
            !cat ? "border-primary/50 bg-primary/15 text-primary" : "border-border bg-card/60 text-foreground/70 hover:border-primary/40"
          )}
        >
          Все
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={href({ cat: cat === c.id ? undefined : c.id, sub: undefined })}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition",
              cat === c.id ? "border-primary/50 bg-primary/15 text-primary" : "border-border bg-card/60 text-foreground/70 hover:border-primary/40"
            )}
          >
            {c.name}
            <span className="ml-1.5 text-xs text-muted-foreground">{c._count.products}</span>
          </Link>
        ))}
      </div>

      {subcategories.length > 0 && (
        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Подразделы</span>
          <Link
            href={href({ sub: undefined })}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
              !sub ? "border-primary/50 bg-primary/15 text-primary" : "border-border bg-card/60 text-foreground/70 hover:border-primary/40"
            )}
          >
            Все
          </Link>
          {subcategories.map((s) => (
            <Link
              key={s.id}
              href={href({ sub: sub === s.id ? undefined : s.id })}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
                sub === s.id ? "border-primary/50 bg-primary/15 text-primary" : "border-border bg-card/60 text-foreground/70 hover:border-primary/40"
              )}
            >
              {s.icon && <span className="mr-1.5">{s.icon}</span>}
              {s.name}
              <span className="ml-1.5 text-xs text-muted-foreground">{s._count.products}</span>
            </Link>
          ))}
        </div>
      )}

      {products.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <PackageSearch className="h-14 w-14 text-muted-foreground/40" />
          <p className="text-lg font-semibold">Ничего не найдено</p>
          <p className="text-sm text-muted-foreground">Попробуйте изменить запрос или сбросить фильтры</p>
          <Link href="/catalog" className="mt-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90">
            Сбросить фильтры
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((p) => (
            <ProductCard key={p.id} product={p as unknown as ProductCardData} />
          ))}
        </div>
      )}
    </div>
  );
}

function plural(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "товар";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "товара";
  return "товаров";
}
