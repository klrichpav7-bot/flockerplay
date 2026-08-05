"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function HeroSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    router.push(q.trim() ? `/catalog?q=${encodeURIComponent(q.trim())}` : "/catalog");
  }

  return (
    <form onSubmit={submit} className="mx-auto flex w-full max-w-xl items-center gap-2 rounded-2xl border border-border bg-card/80 p-2 shadow-2xl shadow-black/30 backdrop-blur-xl transition focus-within:border-primary/60">
      <Search className="ml-2 h-5 w-5 shrink-0 text-muted-foreground" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Поиск ключей, валюты, буста…"
        className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
      <button
        type="submit"
        className="h-11 shrink-0 rounded-xl bg-gradient-to-r from-sky-500 to-violet-600 px-6 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:opacity-90 active:scale-[0.98]"
      >
        Найти
      </button>
    </form>
  );
}
