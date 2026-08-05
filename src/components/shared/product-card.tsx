import Link from "next/link";
import { Flame, Gamepad2, Star } from "lucide-react";
import { VerifiedBadge } from "@/components/shared/verified-badge";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

interface SellerPreview {
  name: string;
  isVerified: boolean;
}

export interface ProductCardData {
  id: string;
  title: string;
  price: number;
  oldPrice?: number | null;
  stock: number;
  soldCount: number;
  rating: number;
  images: string[];
  category?: { name: string } | null;
  seller?: SellerPreview;
}

export function ProductCard({ product, className }: { product: ProductCardData; className?: string }) {
  const discount = product.oldPrice && product.oldPrice > product.price
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;
  const image = product.images?.[0];

  return (
    <Link
      href={`/product/${product.id}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-3xl border border-border/80 bg-card/80 transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10",
        className
      )}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted/40">
        {image ? (
          <img
            src={image}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="grid h-full w-full place-items-center">
            <Gamepad2 className="h-12 w-12 text-muted-foreground/40" />
          </div>
        )}
        <div className="absolute left-3 top-3 flex gap-2">
          {product.category?.name && (
            <Badge variant="secondary" className="border-border bg-black/50 text-white backdrop-blur">
              {product.category.name}
            </Badge>
          )}
          {discount > 0 && <Badge className="bg-rose-500 text-white">−{discount}%</Badge>}
        </div>
        {product.stock === 0 && (
          <div className="absolute inset-0 grid place-items-center bg-black/60 backdrop-blur-[2px]">
            <span className="rounded-full border border-emerald-400/40 bg-emerald-500/15 px-4 py-1.5 text-xs font-semibold text-emerald-300">
              В наличии
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-tight">{product.title}</h3>
          {product.rating > 0 && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-400">
              <Star className="h-3 w-3 fill-amber-400" />
              {product.rating.toFixed(1)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {product.seller && (
            <>
              <span className="inline-flex items-center gap-1">
                {product.seller.name}
                {product.seller.isVerified && <VerifiedBadge size="xs" />}
              </span>
              <span>·</span>
            </>
          )}
          <span className="inline-flex items-center gap-1">
            <Flame className="h-3 w-3 text-rose-400" /> {product.soldCount} продаж
          </span>
        </div>

        <div className="mt-auto flex items-end justify-between pt-1">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-emerald-400">{formatPrice(product.price)}</span>
            {product.oldPrice && product.oldPrice > product.price && (
              <span className="text-xs text-muted-foreground line-through">{formatPrice(product.oldPrice)}</span>
            )}
          </div>
          <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary transition group-hover:bg-primary group-hover:text-white">
            Купить
          </span>
        </div>
      </div>
    </Link>
  );
}
