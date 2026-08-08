import { CategoriesManager } from "@/components/admin/categories-manager";

export const dynamic = "force-dynamic";

export default function AdminCategoriesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Категории</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Разделы каталога. Иконка может быть эмодзи (✈️), URL-картинкой или ключом из библиотеки.
        </p>
      </div>
      <CategoriesManager />
    </div>
  );
}
