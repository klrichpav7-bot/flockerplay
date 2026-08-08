"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, Minus, Plus, ShoppingCart, Zap } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/store/cart";
import { useUserStore } from "@/store/user";
import { api } from "@/lib/api-client";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface BuyPanelProps {
  productId: string;
  title: string;
  price: number;
  oldPrice?: number | null;
  stock: number;
  image: string;
  sellerId: string;
  deliveryType: string;
}

export function BuyPanel({ productId, title, price, oldPrice, stock, image, sellerId, deliveryType }: BuyPanelProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [qty, setQty] = useState(1);
  const [buying, setBuying] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const setBalance = useUserStore((s) => s.setBalance);

  function ensureAuth() {
    if (status === "authenticated") return true;
    router.push(`/login?callbackUrl=${encodeURIComponent(`/product/${productId}`)}`);
    return false;
  }

  function addToCart() {
    addItem({ productId, title, price, image, sellerId, stock }, qty);
    toast.success("Добавлено в корзину", { description: `${title} ×${qty}` });
  }

  async function buyNow() {
    if (!ensureAuth()) return;
    setBuying(true);
    try {
      const res = await api<{ newBalance: number; orders: { id: string }[]; total: number }>("/api/orders", {
        method: "POST",
        body: JSON.stringify({ productId, qty }),
      });
      setBalance(res.newBalance);
      toast.success("Заказ оформлен!", {
        description: `Списано ${formatPrice(res.total)}. Данные товара уже ждут вас на странице заказа.`,
      });
      router.push(`/orders/${res.orders[0].id}`);
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Ошибка";
      toast.error(msg, { description: "Пополните баланс и попробуйте снова" });
    } finally {
      setBuying(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-3xl font-bold text-emerald-400">{formatPrice(price)}</p>
          {oldPrice && oldPrice > price && (
            <p className="mt-1 text-sm text-muted-foreground line-through">{formatPrice(oldPrice)}</p>
          )}
        </div>
        {deliveryType === "AUTO" && (
          <span className="rounded-full bg-sky-500/15 px-3 py-1 text-xs font-semibold text-sky-400">Мгновенная выдача</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="inline-flex items-center rounded-2xl border border-border bg-card/70">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="grid h-11 w-11 place-items-center text-muted-foreground transition hover:text-foreground"
            aria-label="Уменьшить"
          >
            <Minus className="h-4 w-4" />
          </button>
          <Input
            value={qty}
            onChange={(e) => setQty(Math.max(1, Math.min(99, Number(e.target.value) || 1)))}
            className="h-11 w-14 border-0 bg-transparent text-center text-sm font-semibold outline-none focus-visible:ring-0"
          />
          <button
            onClick={() => setQty((q) => Math.min(stock > 0 ? stock : 99, q + 1))}
            className="grid h-11 w-11 place-items-center text-muted-foreground transition hover:text-foreground"
            aria-label="Увеличить"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground">
          {stock > 0 ? `В наличии: ${stock} шт.` : "Безлимит"}
        </p>
      </div>

      <Button onClick={buyNow} className="h-12 w-full text-sm font-semibold" disabled={buying} size="lg">
        {buying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
        Купить сейчас
      </Button>
      <Button onClick={addToCart} variant="secondary" className="h-12 w-full text-sm font-semibold">
        <ShoppingCart className="h-4 w-4" /> В корзину
      </Button>

      {status === "unauthenticated" && (
        <p className="text-center text-xs text-muted-foreground">
          Войдите, чтобы покупать.{" "}
          <Link href="/login" className="font-semibold text-sky-400 hover:text-sky-300">
            Войти
          </Link>
        </p>
      )}
    </div>
  );
}
