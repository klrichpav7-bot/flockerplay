"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { MessagesSquare, PlusSquare, Search, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();
  const { status } = useSession();
  const guest = status !== "authenticated";

  const items = [
    {
      label: "Поиск",
      href: "/catalog",
      icon: Search,
      match: (p: string) => p.startsWith("/catalog"),
    },
    {
      label: "Продать",
      href: guest ? "/login" : "/dashboard/products/new",
      icon: PlusSquare,
      match: (p: string) => p.startsWith("/dashboard/products"),
    },
    {
      label: "Чаты",
      href: guest ? "/login" : "/dashboard/chats",
      icon: MessagesSquare,
      match: (p: string) => p.startsWith("/dashboard/chats"),
    },
    {
      label: "Профиль",
      href: guest ? "/login" : "/dashboard",
      icon: UserRound,
      match: (p: string) =>
        p === "/dashboard" ||
        (p.startsWith("/dashboard") && !p.startsWith("/dashboard/products") && !p.startsWith("/dashboard/chats")),
    },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-4">
        {items.map((it) => {
          const active = it.match(pathname);
          return (
            <Link
              key={it.label}
              href={it.href}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <it.icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
              {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
