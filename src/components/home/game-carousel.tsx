"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import { AppIcon } from "@/components/shared/app-icon";

export type GameCarouselItem = {
  id: string;
  name: string;
  icon: string | null;
  slug: string;
};

export function GameCarousel({ items }: { items: GameCarouselItem[] }) {
  const scroller = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: number) => {
    scroller.current?.scrollBy({ left: dir * 360, behavior: "smooth" });
  };

  if (items.length === 0) return null;

  return (
    <div className="relative">
      <div ref={scroller} className="scrollbar-none -mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2">
        {items.map((c) => (
          <Link
            key={c.id}
            href={`/catalog?cat=${c.id}`}
            className="group flex min-w-[5.5rem] snap-start flex-col items-center gap-2 rounded-2xl border border-border/70 bg-card/60 p-3 text-center transition hover:border-primary/40 hover:bg-card"
          >
            <span className="grid h-14 w-14 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500/20 to-violet-600/20 transition group-hover:from-sky-500 group-hover:to-violet-600">
              <AppIcon icon={c.icon} className="h-7 w-7 text-primary transition group-hover:text-white" textClassName="text-3xl leading-none" />
            </span>
            <span className="w-full truncate text-xs font-semibold">{c.name}</span>
          </Link>
        ))}
      </div>
      <button
        type="button"
        aria-label="Назад"
        onClick={() => scrollBy(-1)}
        className="absolute -left-3 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-border bg-card text-muted-foreground shadow-lg transition hover:text-foreground md:grid"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        aria-label="Вперёд"
        onClick={() => scrollBy(1)}
        className="absolute -right-3 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-border bg-card text-muted-foreground shadow-lg transition hover:text-foreground md:grid"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
