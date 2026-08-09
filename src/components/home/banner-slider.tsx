"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Gamepad2 } from "lucide-react";

export type BannerItem = {
  id: string;
  title: string;
  imageUrl: string | null;
  linkUrl: string | null;
  durationMs: number | null;
};

export function BannerSlider({ banners }: { banners: BannerItem[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const count = banners.length;

  useEffect(() => {
    if (count === 0) return;
    setIndex((i) => (i >= count ? count - 1 : i));
  }, [count]);

  useEffect(() => {
    if (paused || count <= 1) return;
    const current = banners[index];
    const duration = Math.min(60000, Math.max(2000, current?.durationMs ?? 5000));
    timer.current = setTimeout(() => setIndex((i) => (i + 1) % count), duration);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [index, paused, count, banners]);

  if (count === 0) return null;

  const go = (dir: number) => setIndex((i) => (i + dir + count) % count);

  return (
    <div
      className="group relative overflow-hidden rounded-3xl border border-border/70"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {banners.map((b) => (
          <Link
            key={b.id}
            href={b.linkUrl || "/catalog"}
            className="relative h-44 min-w-full shrink-0 overflow-hidden bg-muted/40 sm:h-56 md:h-72"
          >
            {b.imageUrl ? (
              <img src={b.imageUrl} alt={b.title} className="h-full w-full object-contain" />
            ) : (
              <div className="grid h-full w-full place-items-center bg-gradient-to-br from-sky-600/40 to-violet-600/40">
                <Gamepad2 className="h-16 w-16 text-white/70" />
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <p className="absolute bottom-4 left-5 font-display text-xl font-bold text-white drop-shadow sm:text-2xl">
              {b.title}
            </p>
          </Link>
        ))}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="Назад"
            onClick={() => go(-1)}
            className="absolute left-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur transition group-hover:opacity-100 hover:bg-black/60"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Вперёд"
            onClick={() => go(1)}
            className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur transition group-hover:opacity-100 hover:bg-black/60"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {banners.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Слайд ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
