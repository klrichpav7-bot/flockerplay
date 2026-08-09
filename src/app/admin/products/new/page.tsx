import { BadgeCheck } from "lucide-react";
import { ProductForm } from "@/components/dashboard/product-form";
import { Badge } from "@/components/ui/badge";

export default function AdminNewProductPage() {
  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Официальный товар</h1>
        <Badge className="bg-sky-500/15 text-sky-400">
          <BadgeCheck className="h-3 w-3" /> Официально
        </Badge>
      </div>
      <p className="-mt-3 mb-6 text-sm text-muted-foreground">
        Товар публикуется сразу, без модерации, с плашкой «Официально» и автоматически попадает в первый ряд на главной и в
        каталоге.
      </p>
      <ProductForm admin />
    </div>
  );
}
