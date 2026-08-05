import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <Link href="/" className={cn("group inline-flex items-center gap-2.5", className)}>
      <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-sky-400 via-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/40 transition-transform duration-300 group-hover:scale-105">
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white drop-shadow" aria-hidden>
          <path d="M8 5.14v13.72a1 1 0 0 0 1.52.86l10.06-6.86a1 1 0 0 0 0-1.72L9.52 4.28A1 1 0 0 0 8 5.14Z" />
          <circle cx="4.5" cy="7.5" r="1.6" opacity="0.85" />
          <circle cx="4.5" cy="16.5" r="1.6" opacity="0.85" />
        </svg>
      </span>
      {!compact && (
        <span className="font-display text-lg font-bold tracking-tight">
          Flocker<span className="text-gradient">Play</span>
        </span>
      )}
    </Link>
  );
}
