import Link from "next/link";
import { Mail, MessageCircle, Send } from "lucide-react";
import { Logo } from "@/components/shared/logo";

const links = [
  {
    title: "Каталог",
    items: [
      { label: "Ключи и аккаунты", href: "/catalog?cat=keys" },
      { label: "Валюта игр", href: "/catalog?cat=currency" },
      { label: "Буст и прокачка", href: "/catalog?cat=boost" },
      { label: "Донаты", href: "/catalog?cat=donates" },
      { label: "Подарочные карты", href: "/catalog?cat=gift-cards" },
      { label: "Игровые услуги", href: "/catalog?cat=services" },
    ],
  },
  {
    title: "Покупателям",
    items: [
      { label: "Все товары", href: "/catalog" },
      { label: "Пополнить баланс", href: "/dashboard/topup" },
      { label: "Мои заказы", href: "/dashboard/orders" },
      { label: "Поддержка", href: "/support" },
    ],
  },
  {
    title: "Продавцам",
    items: [
      { label: "Начать продавать", href: "/dashboard/sales" },
      { label: "Добавить товар", href: "/dashboard/products/new" },
      { label: "Мои товары", href: "/dashboard/products" },
      { label: "Реклама и баннеры", href: "/dashboard/banners" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70 bg-background/60">
      <div className="section grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Игровой маркетплейс цифровых товаров и услуг. Покупай и продавай быстро, безопасно и выгодно.
          </p>
          <div className="mt-5 flex flex-col gap-2 text-sm text-muted-foreground">
            <a href="mailto:Flocker@gmail.com" className="inline-flex w-fit items-center gap-2 transition hover:text-foreground">
              <Mail className="h-4 w-4" /> Flocker@gmail.com
            </a>
            <a href="https://t.me/flockerplay" target="_blank" rel="noreferrer" className="inline-flex w-fit items-center gap-2 transition hover:text-foreground">
              <Send className="h-4 w-4" /> Telegram-канал
            </a>
            <span className="inline-flex w-fit items-center gap-2">
              <MessageCircle className="h-4 w-4" /> Поддержка 24/7
            </span>
          </div>
        </div>

        {links.map((col) => (
          <div key={col.title}>
            <p className="text-sm font-semibold uppercase tracking-wide text-foreground/90">{col.title}</p>
            <ul className="mt-4 space-y-2.5">
              {col.items.map((i) => (
                <li key={i.href + i.label}>
                  <Link href={i.href} className="text-sm text-muted-foreground transition hover:text-foreground">
                    {i.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border/60">
        <div className="section flex flex-col items-center justify-between gap-3 py-5 text-xs text-muted-foreground sm:flex-row">
          <p>© 2026 FlockerPlay. Все права защищены.</p>
          <p>
            Сделано с <span className="text-rose-500">♥</span> для игроков
          </p>
        </div>
      </div>
    </footer>
  );
}
