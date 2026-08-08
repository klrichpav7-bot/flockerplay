"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowRight, BadgePercent, Loader2, Minus, Plus, ShoppingBag, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useCartStore, cartTotal, cartCount } from "@/store/cart";
import { useUserStore } from "@/store/user";
import { api } from "@/lib/api-client";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/button";

interface CartDiscount {
  value: number;
  code: string;
}

export default function CartPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { items, setQty, removeItem, clear } = useCartStore();
  const setBalance = useUserStore((s) => s.setBalance);
  const [buying, setBuying] = useState(false);
  const [discount, setDiscount] = useState<CartDiscount | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/promo/current")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.discount) setDiscount({ value: data.discount.value, code: data.discount.code });
      })
      .catch(() => {});
  }, [status]);

  const total = cartTotal(items);
  const count = cartCount(items);
  const payable = discount
    ? items.reduce((s, i) => s + Math.round((i.price * i.qty * (100 - discount.value)) / 100), 0)
    : total;
  const discountAmount = total - payable;

  async function checkout() {
    if (status !== "authenticated") {
      router.push("/login?callbackUrl=/cart");
      return;
    }
    setBuying(true);
    try {
      const res = await api<{ newBalance: number; total: number; orders: { id: string }[] }>("/api/orders", {
        method: "POST",
        body: JSON.stringify({ items: items.map((i) => ({ productId: i.productId, qty: i.qty })) }),
      });
      setBalance(res.newBalance);
      clear();
      toast.success("Заказ оформлен!", { description: `Списано ${formatPrice(res.total)}. Данные товаров ждут вас на странице заказа.` });
      if (res.orders?.length > 0) {
        router.push(`/orders/${res.orders[0].id}`);
      } else {
        router.push("/dashboard/orders");
      }
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка", {
        description: "Пополните баланс и попробуйте снова",
      });
    } finally {
      setBuying(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="section flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
        <span className="grid h-24 w-24 place-items-center rounded-3xl bg-card/70">
          <ShoppingBag className="h-12 w-12 text-muted-foreground/40" />
        </span>
        <h1 className="font-display mt-6 text-2xl font-bold">Корзина пуста</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Загляните в каталог — там сотни игровых товаров по выгодным ценам.
        </p>
        <Link href="/catalog" className="btn-primary-gradient mt-8 px-8 py-3 text-sm font-semibold">
          Перейти в каталог
        </Link>
      </div>
    );
  }

  return (
    <div className="section py-10">
      <h1 className="font-display mb-8 text-3xl font-bold">
        Корзина <span className="text-lg font-normal text-muted-foreground">({count} шт.)</span>
      </h1>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {items.map((i) => (
            <div
              key={i.productId}
              className="flex gap-4 rounded-3xl border border-border/80 bg-card/60 p-4 transition hover:border-border"
            >
              <Link href={`/product/${i.productId}`} className="shrink-0 overflow-hidden rounded-2xl">
                {i.image ? (
                  <img src={i.image} alt={i.title} className="h-24 w-24 object-cover sm:h-28 sm:w-28" />
                ) : (
                  <span className="grid h-24 w-24 place-items-center bg-muted/40 sm:h-28 sm:w-28">
                    <ShoppingCart className="h-8 w-8 text-muted-foreground/40" />
                  </span>
                )}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/product/${i.productId}`} className="line-clamp-2 text-sm font-semibold hover:text-sky-400">
                      {i.title}
                    </Link>
                    <p className="mt-1 text-sm font-bold text-emerald-400">{formatPrice(i.price)}</p>
                  </div>
                  <button
                    onClick={() => removeItem(i.productId)}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-muted-foreground transition hover:bg-rose-500/10 hover:text-rose-400"
                    aria-label="Удалить"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center rounded-xl border border-border bg-card/70">
                    <button
                      onClick={() => setQty(i.productId, i.qty - 1)}
                      className="grid h-9 w-9 place-items-center text-muted-foreground hover:text-foreground"
                      aria-label="Меньше"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-10 text-center text-sm font-semibold">{i.qty}</span>
                    <button
                      onClick={() => setQty(i.productId, i.qty + 1)}
                      className="grid h-9 w-9 place-items-center text-muted-foreground hover:text-foreground"
                      aria-label="Больше"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="text-sm font-semibold">{formatPrice(i.price * i.qty)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="h-fit rounded-3xl border border-border/80 bg-card/60 p-6 lg:sticky lg:top-24">
          <h2 className="text-lg font-semibold">Итого</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Товаров</span>
              <span>{count} шт.</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Доставка</span>
              <span className="text-emerald-400">Мгновенно</span>
            </div>
            {discount && discountAmount > 0 && (
              <div className="flex items-center justify-between rounded-xl bg-violet-500/10 px-3 py-2 text-violet-300">
                <span className="flex items-center gap-1.5">
                  <BadgePercent className="h-4 w-4" />
                  Скидка {discount.value}% ({discount.code})
                </span>
                <span>−{formatPrice(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-border pt-3 text-base font-bold">
              <span>К оплате</span>
              <span className="text-emerald-400">{formatPrice(payable)}</span>
            </div>
          </div>
          <Button onClick={checkout} className="mt-5 w-full" size="lg" disabled={buying}>
            {buying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            Оформить заказ
          </Button>
          {status !== "authenticated" && (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Для оформления заказа необходимо{" "}
              <Link href="/login?callbackUrl=/cart" className="font-semibold text-sky-400 hover:text-sky-300">
                войти
              </Link>
            </p>
          )}
          <div className="mt-4 rounded-2xl bg-emerald-500/10 px-4 py-3 text-xs text-emerald-400">
            Оплата с внутреннего баланса. Пополнить его можно в личном кабинете.
          </div>
        </div>
      </div>
    </div>
  );
}
