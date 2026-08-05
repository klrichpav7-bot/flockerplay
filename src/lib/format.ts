import { format, formatDistanceToNowStrict, isSameDay, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

export function formatPrice(n: number | null | undefined): string {
  return `${new Intl.NumberFormat("ru-RU").format(n ?? 0)} ₽`;
}

export function formatNumber(n: number | null | undefined): string {
  return new Intl.NumberFormat("ru-RU").format(n ?? 0);
}

export function formatDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? parseISO(d) : d;
  return format(date, "d MMM yyyy, HH:mm", { locale: ru });
}

export function formatShortDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? parseISO(d) : d;
  return format(date, "d MMM", { locale: ru });
}

export function timeAgo(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? parseISO(d) : d;
  return formatDistanceToNowStrict(date, { addSuffix: true, locale: ru });
}

export function isToday(d: string | Date): boolean {
  const date = typeof d === "string" ? parseISO(d) : d;
  return isSameDay(date, new Date());
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
