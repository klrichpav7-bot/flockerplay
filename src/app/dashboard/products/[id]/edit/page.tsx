import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ProductForm } from "@/components/dashboard/product-form";
import { productImages } from "@/lib/product-images";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product || product.sellerId !== session?.user?.id) notFound();

  return (
    <div className="max-w-2xl">
      <Link href="/dashboard/products" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> К моим товарам
      </Link>
      <h1 className="font-display mb-6 text-2xl font-bold sm:text-3xl">Редактировать товар</h1>
      <ProductForm
        initial={{
          id: product.id,
          title: product.title,
          description: product.description,
          categoryId: product.categoryId,
          price: product.price,
          oldPrice: product.oldPrice,
          stock: product.stock,
          deliveryType: product.deliveryType,
          deliveryInfo: product.deliveryInfo,
          images: productImages(product.images),
        }}
      />
    </div>
  );
}
