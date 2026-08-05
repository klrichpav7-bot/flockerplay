"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";

const sortOptions = [
  { value: "", label: "По популярности" },
  { value: "newest", label: "Сначала новые" },
  { value: "price-asc", label: "Дешевле" },
  { value: "price-desc", label: "Дороже" },
  { value: "rating", label: "По рейтингу" },
];

export function CatalogFilterBar() {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");

  function apply(next: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(next)) {
      if (v) params.set(k, v);
    }
    router.push(`/catalog${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          apply({ q: q.trim() || undefined, cat: sp.get("cat") ?? undefined, sort: sp.get("sort") ?? undefined });
        }}
        className="flex flex-1 items-center gap-2 rounded-2xl border border-border bg-card/70 px-3"
      >
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Поиск по каталогу…"
          className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </form>
      <div className="relative">
        <SlidersHorizontal className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <select
          value={sp.get("sort") ?? ""}
          onChange={(e) => apply({ sort: e.target.value || undefined, cat: sp.get("cat") ?? undefined, q: sp.get("q") ?? undefined })}
          className="h-11 w-full appearance-none rounded-2xl border border-border bg-card/70 pl-10 pr-8 text-sm outline-none transition focus:border-primary/50 sm:w-56"
        >
          {sortOptions.map((o) => (
            <option key={o.value} value={o.value} className="bg-popover">
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
