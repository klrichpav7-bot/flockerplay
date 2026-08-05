"use client";

import { useEffect } from "react";
import { Coins } from "lucide-react";
import Link from "next/link";
import { useUserStore } from "@/store/user";
import { formatPrice } from "@/lib/format";

export function BalanceChip({ initialBalance, className }: { initialBalance: number; className?: string }) {
  const balance = useUserStore((s) => s.balance);
  const setBalance = useUserStore((s) => s.setBalance);

  useEffect(() => {
    if (balance === null) setBalance(initialBalance);
  }, [initialBalance, balance, setBalance]);

  const shown = balance ?? initialBalance;

  return (
    <Link
      href="/dashboard/topup"
      className={
        "inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-sm font-semibold text-emerald-400 transition hover:border-emerald-500/60 hover:bg-emerald-500/20 " +
        (className ?? "")
      }
    >
      <Coins className="h-4 w-4 text-amber-400" />
      {formatPrice(shown)}
    </Link>
  );
}
