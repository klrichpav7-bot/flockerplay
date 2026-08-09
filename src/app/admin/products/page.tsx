import Link from "next/link";
import { BadgeCheck, Plus } from "lucide-react";
import { ProductsList } from "@/components/admin/products-list";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default function AdminProductsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Модерация товаров</h1>
          <p className="mt-1 text-sm text-muted-foreground">Опубликуйте новые товары, скройте неугодные или отметьте лучшие.</p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">
            <BadgeCheck className="h-4 w-4" /> Официальный товар
          </Link>
        </Button>
      </div>
      <ProductsList />
    </div>
  );
}
