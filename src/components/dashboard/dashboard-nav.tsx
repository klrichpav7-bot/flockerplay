"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Banknote,
  Flag,
  LayoutDashboard,
  Megaphone,
  MessagesSquare,
  Package,
  ShoppingBag,
  Store,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Обзор", icon: LayoutDashboard },
  { href: "/dashboard/topup", label: "Пополнение", icon: Wallet },
  { href: "/dashboard/withdrawals", label: "Вывод средств", icon: Banknote },
  { href: "/dashboard/orders", label: "Мои заказы", icon: ShoppingBag },
  { href: "/dashboard/chats", label: "Чаты", icon: MessagesSquare },
  { href: "/dashboard/sales", label: "Продажи", icon: TrendingUp },
  { href: "/dashboard/products", label: "Мои товары", icon: Package },
  { href: "/dashboard/products/new", label: "Добавить товар", icon: Store },
  { href: "/dashboard/banners", label: "Реклама", icon: Megaphone },
  { href: "/dashboard/complaints", label: "Жалобы", icon: Flag },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <aside className="h-fit rounded-3xl border border-border/80 bg-card/60 p-3 lg:sticky lg:top-24">
      <nav className="grid grid-cols-2 gap-1 lg:grid-cols-1">
        {links.map((l) => {
          const active =
            l.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                active
                  ? "bg-gradient-to-r from-sky-500/20 to-violet-600/20 text-foreground ring-1 ring-primary/30"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <l.icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
              <span className="truncate">{l.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
