"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, X } from "lucide-react";

interface TopBannerData {
  banner: { id: string; title: string; imageUrl: string | null; linkUrl: string | null } | null;
}

export function TopBanner() {
  const [banner, setBanner] = useState<TopBannerData["banner"] | null>(null);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/top-banner")
      .then((r) => r.json())
      .then((d: TopBannerData) => {
        if (cancelled) return;
        setBanner(d.banner);
        try {
          setHidden(localStorage.getItem("fp-top-banner-hidden") === d.banner?.id);
        } catch {
          setHidden(false);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!banner) return null;
  const b = banner;
  if (hidden) return null;

  function dismiss() {
    setHidden(true);
    try {
      localStorage.setItem("fp-top-banner-hidden", b.id);
    } catch {
      /* noop */
    }
  }

  return (
    <div className="relative z-40 border-b border-border/60 bg-gradient-to-r from-sky-600 via-indigo-600 to-violet-600 text-white">
      <Link href={b.linkUrl || "/catalog"} className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-12 py-2.5 text-center">
        <Sparkles className="h-4 w-4 shrink-0" />
        <span className="truncate text-sm font-semibold">{b.title}</span>
      </Link>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Скрыть"
        className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-white/80 transition hover:bg-white/20 hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
