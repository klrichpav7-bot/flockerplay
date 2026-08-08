import { SubcategoriesManager } from "@/components/admin/subcategories-manager";

export const dynamic = "force-dynamic";

export default function AdminSubcategoriesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Подкатегории</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Внутренние подразделы категорий (например, «Звёзды», «Премиум» внутри Telegram). Отображаются на странице
          каталога при выбранном разделе.
        </p>
      </div>
      <SubcategoriesManager />
    </div>
  );
}
