import type { Prisma } from "@prisma/client";

export function productImages(value: Prisma.JsonValue | null | undefined): string[] {
  if (!value || !Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}
