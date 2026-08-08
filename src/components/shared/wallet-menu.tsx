"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDownUp, ChevronDown, Coins, Flag, History, Package, PlusCircle, Wallet } from "lucide-react";
import { useUserStore } from "@/store/user";
import { formatPrice } from "@/lib/format";

const menuItems = [
  { href: "/dashboard/topup", label: "Пополнить", icon: PlusCircle, hint: "ЮMoney / заявка" },
  { href: "/dashboard/withdrawals", label: "Выплата", icon: ArrowDownUp, hint: "Вывод средств" },
  { href: "/dashboard/orders", label: "Мои покупки", icon: Package, hint: "Заказы и споры" },
  { href: "/dashboard/sales", label: "Мои продажи", icon: History, hint: "Заказы продавца" },
  { href: "/dashboard/complaints", label: "Мои жалобы", icon: Flag, hint: "Споры и проблемы" },
];

export function WalletMenu({
  initialBalance,
  className,
}: {
  initialBalance: number;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const balance = useUserStore((s) => s.balance);
  const setBalance = useUserStore((s) => s.setBalance);

  useEffect(() => {
    if (balance === null) setBalance(initialBalance);
  }, [initialBalance, balance, setBalance]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const shown = balance ?? initialBalance;

  return (
    <div ref={ref} className={`relative ${className ?? ""}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-sm font-semibold text-emerald-400 transition hover:border-emerald-500/60 hover:bg-emerald-500/20"
      >
        <Coins className="h-4 w-4 text-amber-400" />
        {formatPrice(shown)}
        <ChevronDown className={`h-3.5 w-3.5 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-2xl border border-border bg-popover p-1.5 shadow-2xl shadow-black/50">
          <div className="mb-1 flex items-center gap-2 rounded-xl px-3 py-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-500/15 text-emerald-400">
              <Wallet className="h-4 w-4" />
            </span>
            <div className="leading-tight">
              <p className="text-[11px] text-muted-foreground">Баланс</p>
              <p className="text-sm font-bold text-emerald-400">{formatPrice(shown)}</p>
            </div>
          </div>
          {menuItems.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-foreground/80 transition hover:bg-muted/60 hover:text-foreground"
            >
              <i.icon className="h-4 w-4 text-foreground/60" />
              <span className="flex-1">{i.label}</span>
              <span className="text-[11px] text-muted-foreground">{i.hint}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
