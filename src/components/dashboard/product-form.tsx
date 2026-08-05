"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { productSchema } from "@/lib/validations";
import { api } from "@/lib/api-client";
import { ImageUploader } from "@/components/shared/image-uploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type FormValues = z.infer<typeof productSchema>;

interface Category {
  id: string;
  name: string;
}

interface ProductFormProps {
  initial?: {
    id: string;
    title: string;
    description: string;
    categoryId: string;
    price: number;
    oldPrice?: number | null;
    stock: number;
    deliveryType: string;
    deliveryInfo: string;
    images: string[];
  };
}

export function ProductForm({ initial }: ProductFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: initial
      ? {
          title: initial.title,
          description: initial.description,
          categoryId: initial.categoryId,
          price: initial.price,
          oldPrice: initial.oldPrice ?? undefined,
          stock: initial.stock,
          deliveryType: initial.deliveryType as "AUTO" | "MANUAL",
          deliveryInfo: initial.deliveryInfo,
        }
      : {
          title: "",
          description: "",
          categoryId: "",
          price: undefined as unknown as number,
          oldPrice: undefined,
          stock: 0,
          deliveryType: "AUTO",
          deliveryInfo: "",
        },
  });

  const deliveryType = watch("deliveryType");

  useEffect(() => {
    api<{ categories: Category[] }>("/api/categories")
      .then((d) => setCategories(d.categories))
      .catch(() => {});
  }, []);

  async function onSubmit(values: FormValues) {
    if (images.length === 0) {
      toast.error("Добавьте изображение товара");
      return;
    }
    setLoading(true);
    try {
      const payload = { ...values, images };
      if (initial) {
        await api(`/api/products/${initial.id}`, { method: "PATCH", body: JSON.stringify(payload) });
        toast.success("Товар обновлён", { description: "После изменений товар снова проходит модерацию." });
      } else {
        await api("/api/products", { method: "POST", body: JSON.stringify(payload) });
        toast.success("Товар отправлен на модерацию", { description: "Как только админ одобрит его, он появится в каталоге." });
      }
      router.push("/dashboard/products");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }

  function setImage(url: string) {
    const next = [...images];
    if (url) next[0] = url;
    else next.splice(0, 1);
    setImages(next);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 rounded-3xl border border-border/80 bg-card/60 p-6">
      <div className="space-y-2">
        <Label htmlFor="title">Название товара</Label>
        <Input id="title" placeholder="Например: Steam Gift Card 500 ₽" {...register("title")} />
        {errors.title && <p className="text-xs text-rose-400">{errors.title.message}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="categoryId">Категория</Label>
          <select
            id="categoryId"
            className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary/60"
            {...register("categoryId")}
          >
            <option value="">Выберите категорию</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {errors.categoryId && <p className="text-xs text-rose-400">{errors.categoryId.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="deliveryType">Тип выдачи</Label>
          <select
            id="deliveryType"
            className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary/60"
            {...register("deliveryType")}
          >
            <option value="AUTO">Автовыдача (ключ/код сразу)</option>
            <option value="MANUAL">Ручная выдача (продавец)</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="price">Цена, ₽</Label>
          <Input id="price" type="number" min={1} placeholder="500" {...register("price")} />
          {errors.price && <p className="text-xs text-rose-400">{errors.price.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="oldPrice">Старая цена, ₽ (необязательно)</Label>
          <Input id="oldPrice" type="number" min={0} placeholder="650" {...register("oldPrice")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stock">Остаток (0 = безлимит)</Label>
          <Input id="stock" type="number" min={0} placeholder="0" {...register("stock")} />
          {errors.stock && <p className="text-xs text-rose-400">{errors.stock.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="deliveryInfo">
          {deliveryType === "AUTO" ? "Данные для автовыдачи (ключи, коды)" : "Инструкция для покупателя"}
        </Label>
        <Textarea
          id="deliveryInfo"
          rows={3}
          placeholder={
            deliveryType === "AUTO"
              ? "Сюда вставляются ключи/коды. Разделяйте несколько позиций пустой строкой."
              : "Что покупатель должен предоставить для выдачи (например, Steam логин)."
          }
          {...register("deliveryInfo")}
        />
        {errors.deliveryInfo && <p className="text-xs text-rose-400">{errors.deliveryInfo.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Описание</Label>
        <Textarea id="description" rows={5} placeholder="Подробно опишите товар, условия и гарантии…" {...register("description")} />
        {errors.description && <p className="text-xs text-rose-400">{errors.description.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Изображение</Label>
        <ImageUploader value={images[0]} onChange={setImage} label="Загрузить изображение товара" />
      </div>

      <Button type="submit" className="w-full sm:w-auto" disabled={loading} size="lg">
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        <Save className="h-4 w-4" />
        {initial ? "Сохранить изменения" : "Опубликовать товар"}
      </Button>
    </form>
  );
}
