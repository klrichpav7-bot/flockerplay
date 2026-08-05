"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Flag,
  Headphones,
  LayoutDashboard,
  Megaphone,
  Package,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Обзор", icon: LayoutDashboard },
  { href: "/admin/users", label: "Пользователи", icon: Users },
  { href: "/admin/topups", label: "Пополнения", icon: Wallet },
  { href: "/admin/products", label: "Товары", icon: Package },
  { href: "/admin/banners", label: "Баннеры", icon: Megaphone },
  { href: "/admin/complaints", label: "Жалобы", icon: Flag },
  { href: "/admin/tickets", label: "Поддержка", icon: Headphones },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <aside className="h-fit rounded-3xl border border-border/80 bg-card/60 p-3 lg:sticky lg:top-24">
      <div className="mb-2 flex items-center gap-2 px-4 py-2">
        <ShieldCheck className="h-4 w-4 text-violet-400" />
        <span className="text-xs font-semibold uppercase tracking-wider text-violet-400">Админ-панель</span>
      </div>
      <nav className="grid grid-cols-2 gap-1 lg:grid-cols-1">
        {links.map((l) => {
          const active = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                active
                  ? "bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 text-foreground ring-1 ring-violet-500/30"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <l.icon className={cn("h-4 w-4 shrink-0", active ? "text-violet-400" : "text-muted-foreground")} />
              <span className="truncate">{l.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
