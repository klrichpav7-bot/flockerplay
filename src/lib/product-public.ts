import type { Prisma } from "@prisma/client";

export const publicProductSelect = {
  id: true,
  title: true,
  description: true,
  price: true,
  oldPrice: true,
  stock: true,
  images: true,
  deliveryType: true,
  status: true,
  isFeatured: true,
  isOfficial: true,
  soldCount: true,
  rating: true,
  ratingCount: true,
  categoryId: true,
  sellerId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProductSelect;
