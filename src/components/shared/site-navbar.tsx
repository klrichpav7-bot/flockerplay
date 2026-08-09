"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  LogOut,
  Menu,
  MessagesSquare,
  Package,
  PlusCircle,
  ShoppingCart,
  Store,
  User,
  X,
} from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { VerifiedBadge } from "@/components/shared/verified-badge";
import { WalletMenu } from "@/components/shared/wallet-menu";
import { NotificationsBell } from "@/components/shared/notifications";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { ChatsLink } from "@/components/shared/chats-link";
import { NavSearch } from "@/components/shared/nav-search";
import { MobileSearch } from "@/components/shared/mobile-search";
import { useCartStore, cartCount } from "@/store/cart";
import { useUserStore } from "@/store/user";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/catalog", label: "Каталог" },
  { href: "/stars", label: "ТГ-звёзды" },
  { href: "/catalog?sort=popular", label: "Топ продаж" },
  { href: "/dashboard/sales", label: "Продавать" },
  { href: "/support", label: "Поддержка" },
];

export function SiteNavbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = useCartStore((s) => s.items);
  const balance = useUserStore((s) => s.balance);
  const setBalance = useUserStore((s) => s.setBalance);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (session?.user && balance === null) setBalance(session.user.balance);
  }, [session, balance, setBalance]);

  const count = cartCount(items);
  const user = session?.user;

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/70 backdrop-blur-xl">
      <div className="section flex h-16 items-center justify-between gap-3">
        <div className="flex items-center gap-6">
          <Logo />
          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium text-foreground/70 transition hover:bg-muted/60 hover:text-foreground",
                  pathname.startsWith(l.href.split("?")[0]) && "bg-muted/60 text-foreground"
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {user && <WalletMenu initialBalance={user.balance} className="hidden sm:block" />}
          <NavSearch />

          <Link
            href="/cart"
            className="relative grid h-10 w-10 place-items-center rounded-full border border-border bg-card/60 text-foreground/80 transition hover:border-primary/40 hover:text-foreground"
            aria-label="Корзина"
          >
            <ShoppingCart className="h-[18px] w-[18px]" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-white shadow-lg shadow-primary/40">
                {count}
              </span>
            )}
          </Link>

          {user && <NotificationsBell className="hidden sm:block" />}
          {user && <ChatsLink className="hidden sm:grid" />}
          <ThemeToggle />

          {status === "loading" ? (
            <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
          ) : user ? (
            <div className="flex items-center gap-2">
              <span className="hidden text-right leading-tight sm:block">
                <span className="flex items-center gap-1 text-sm font-semibold">
                  {user.name}
                  {user.isVerified && <VerifiedBadge size="xs" />}
                </span>
                <span className="block text-[11px] text-muted-foreground">
                  {user.isSeller ? "Продавец" : "Покупатель"}
                </span>
              </span>
              <UserMenu
                user={user}
                onLogout={() => signOut({ callbackUrl: "/" })}
                trigger={
                  <Avatar className="h-10 w-10 cursor-pointer ring-2 ring-primary/30 transition hover:ring-primary/60">
                    <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name ?? ""} />
                    <AvatarFallback>{initials(user.name ?? "")}</AvatarFallback>
                  </Avatar>
                }
              />
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Войти</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Регистрация</Link>
              </Button>
            </div>
          )}

          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card/60 lg:hidden"
            aria-label="Меню"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div className="border-t border-border/50 px-4 py-2.5 lg:hidden">
        <MobileSearch />
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-background/95 lg:hidden">
          <div className="section flex flex-col gap-1 py-4">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-xl px-3 py-2.5 text-sm font-medium text-foreground/80 transition hover:bg-muted/60"
              >
                {l.label}
              </Link>
            ))}
            {!user && (
              <div className="mt-2 flex gap-2">
                <Button asChild className="flex-1">
                  <Link href="/login">Войти</Link>
                </Button>
                <Button asChild variant="secondary" className="flex-1">
                  <Link href="/register">Регистрация</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function UserMenu({
  user,
  onLogout,
  trigger,
}: {
  user: NonNullable<ReturnType<typeof useSession>["data"]>["user"];
  onLogout: () => void;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const items = [
    { href: "/dashboard", label: "Личный кабинет", icon: LayoutDashboard },
    { href: "/dashboard/profile", label: "Профиль", icon: User },
    { href: "/dashboard/orders", label: "Мои заказы", icon: Package },
    { href: "/dashboard/chats", label: "Чаты", icon: MessagesSquare },
    { href: "/dashboard/sales", label: "Продажи", icon: Store },
    { href: "/dashboard/products/new", label: "Добавить товар", icon: PlusCircle },
  ];

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} className="block rounded-full">
        {trigger}
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-50 w-60 overflow-hidden rounded-2xl border border-border bg-popover p-1.5 shadow-2xl shadow-black/50">
          {user.role === "ROLE_ADMIN" && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 px-3 py-2.5 text-sm font-semibold text-violet-300 transition hover:bg-violet-600/30"
            >
              <Store className="h-4 w-4" /> Админ-панель
            </Link>
          )}
          {items.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-foreground/80 transition hover:bg-muted/60 hover:text-foreground"
            >
              <i.icon className="h-4 w-4 text-foreground/60" /> {i.label}
            </Link>
          ))}
          <button
            onClick={onLogout}
            className="mt-1 flex w-full items-center gap-2.5 rounded-xl border-t border-border/60 px-3 py-2.5 text-sm text-rose-400 transition hover:bg-rose-500/10"
          >
            <LogOut className="h-4 w-4" /> Выйти
          </button>
        </div>
      )}
    </div>
  );
}
