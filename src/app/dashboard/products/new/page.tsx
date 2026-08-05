import { ProductForm } from "@/components/dashboard/product-form";

export default function NewProductPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="font-display mb-6 text-2xl font-bold sm:text-3xl">Добавить товар</h1>
      <ProductForm />
    </div>
  );
}
