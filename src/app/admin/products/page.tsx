import { ProductsList } from "@/components/admin/products-list";

export const dynamic = "force-dynamic";

export default function AdminProductsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Модерация товаров</h1>
        <p className="mt-1 text-sm text-muted-foreground">Опубликуйте новые товары, скройте неугодные или отметьте лучшие.</p>
      </div>
      <ProductsList />
    </div>
  );
}
