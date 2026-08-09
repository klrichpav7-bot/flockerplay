import Link from "next/link";
import { Pencil, PlusCircle, Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DeleteProductButton } from "@/components/dashboard/delete-product-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { productImages } from "@/lib/product-images";

export const dynamic = "force-dynamic";

const statusMap: Record<string, { label: string; className: string }> = {
  PENDING: { label: "На модерации", className: "bg-amber-500/15 text-amber-400" },
  APPROVED: { label: "Опубликован", className: "bg-emerald-500/15 text-emerald-400" },
  HIDDEN: { label: "Скрыт", className: "bg-muted text-muted-foreground" },
  REJECTED: { label: "Отклонён", className: "bg-rose-500/15 text-rose-400" },
};

export default async function MyProductsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const products = await prisma.product.findMany({
    where: { sellerId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { category: { select: { name: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Мои товары</h1>
          <p className="mt-1 text-sm text-muted-foreground">{products.length} товаров</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/products/new">
            <PlusCircle className="h-4 w-4" /> Добавить товар
          </Link>
        </Button>
      </div>

      {products.length === 0 ? (
        <div className="rounded-3xl border border-border/80 bg-card/60 p-12 text-center">
          <p className="text-lg font-semibold">У вас пока нет товаров</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Добавьте первый товар — после модерации он появится в каталоге и станет доступен для покупки.
          </p>
          <Button asChild className="mt-6">
            <Link href="/dashboard/products/new">
              <PlusCircle className="h-4 w-4" /> Добавить товар
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((p) => {
            const st = statusMap[p.status] ?? { label: p.status, className: "" };
            return (
              <div key={p.id} className="flex flex-wrap items-center gap-4 rounded-3xl border border-border/80 bg-card/60 p-4">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-muted/40">
                  {productImages(p.images)[0] ? (
                    <img src={productImages(p.images)[0]} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="grid h-full w-full place-items-center text-xs text-muted-foreground">—</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{p.title}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {p.category?.name} · {formatPrice(p.price)} · продано: {p.soldCount}
                  </p>
                </div>
                <Badge className={st.className}>{st.label}</Badge>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/products/${p.id}/edit`}
                    className="grid h-9 w-9 place-items-center rounded-xl border border-border text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                    aria-label="Редактировать"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <DeleteProductButton id={p.id} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
