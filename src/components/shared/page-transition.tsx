"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

export function PageTransition() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const prevPath = useRef(pathname);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      const a = target?.closest?.("a[href]");
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("#") || href.startsWith("mailto:")) return;
      if (a.getAttribute("target") === "_blank") return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      setActive(true);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    if (!active) return;
    const fallback = setTimeout(() => setActive(false), 900);
    return () => clearTimeout(fallback);
  }, [active]);

  useEffect(() => {
    if (prevPath.current !== pathname) {
      prevPath.current = pathname;
      const t = setTimeout(() => setActive(false), 420);
      return () => clearTimeout(t);
    }
  }, [pathname]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-[100] grid place-items-center bg-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.3 } }}
          transition={{ duration: 0.12 }}
        >
          <motion.div
            className="flex flex-col items-center gap-4"
            initial={{ scale: 0.86, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.18 }}
          >
            <span className="grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-sky-400 via-indigo-500 to-violet-600 shadow-xl shadow-indigo-500/30">
              <svg viewBox="0 0 24 24" className="h-9 w-9 fill-white drop-shadow" aria-hidden>
                <path d="M8 5.14v13.72a1 1 0 0 0 1.52.86l10.06-6.86a1 1 0 0 0 0-1.72L9.52 4.28A1 1 0 0 0 8 5.14Z" />
                <circle cx="4.5" cy="7.5" r="1.6" opacity="0.85" />
                <circle cx="4.5" cy="16.5" r="1.6" opacity="0.85" />
              </svg>
            </span>
            <span className="font-display text-2xl font-bold tracking-tight text-slate-900">
              Flocker<span className="bg-gradient-to-r from-sky-500 to-violet-600 bg-clip-text text-transparent">Play</span>
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
