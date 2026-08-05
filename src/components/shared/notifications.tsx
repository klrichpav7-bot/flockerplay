"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, Inbox } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/format";

interface NotificationItem {
  id: string;
  title: string;
  body?: string | null;
  type: string;
  isRead: boolean;
  createdAt: string;
}

const typeColor: Record<string, string> = {
  info: "bg-sky-500",
  topup: "bg-emerald-500",
  order: "bg-violet-500",
  ticket: "bg-amber-500",
  support: "bg-fuchsia-500",
  complaint: "bg-rose-500",
};

export function NotificationsBell({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async (silent = false) => {
    try {
      const data = await api<NotificationItem[]>("/api/notifications");
      const prev = itemsRef.current;
      setItems(data);
      setLoaded(true);
      if (!silent && prev && prev.length > 0 && data.length > prev.length) {
        const fresh = data.slice(0, data.length - prev.length);
        fresh.forEach((n) => {
          toast(n.title, {
            description: n.body ?? undefined,
            duration: 5000,
          });
        });
      }
      itemsRef.current = data;
    } catch {
      /* not authed */
    }
  }, []);

  const itemsRef = useRef<NotificationItem[]>([]);

  useEffect(() => {
    load(true);
    const t = setInterval(() => load(true), 30000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const unread = items.filter((i) => !i.isRead).length;

  async function markAll() {
    await api("/api/notifications/read", { method: "POST" }).catch(() => {});
    setItems((prev) => prev.map((i) => ({ ...i, isRead: true })));
  }

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        onClick={() => {
          setOpen((o) => !o);
          if (!open) load(false);
        }}
        className="relative grid h-10 w-10 place-items-center rounded-full border border-border bg-card/60 text-foreground/80 transition hover:border-primary/40 hover:text-foreground"
        aria-label="Уведомления"
      >
        <Bell className="h-[18px] w-[18px]" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-lg shadow-rose-500/40">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[22rem] max-w-[90vw] overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl shadow-black/50">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold">Уведомления</p>
            {unread > 0 && (
              <button
                onClick={markAll}
                className="inline-flex items-center gap-1 text-xs text-sky-400 transition hover:text-sky-300"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Прочитать все
              </button>
            )}
          </div>
          <div className="max-h-[22rem] overflow-y-auto">
            {!loaded && (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">Загрузка…</p>
            )}
            {loaded && items.length === 0 && (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <Inbox className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">Уведомлений пока нет</p>
              </div>
            )}
            {items.map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  api(`/api/notifications/${n.id}/read`, { method: "POST" }).catch(() => {});
                  setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, isRead: true } : i)));
                }}
                className={cn(
                  "flex w-full gap-3 border-b border-border/60 px-4 py-3 text-left transition hover:bg-muted/40",
                  !n.isRead && "bg-primary/5"
                )}
              >
                <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", typeColor[n.type] ?? "bg-sky-500")} />
                <span className="min-w-0">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">{n.title}</span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">{timeAgo(n.createdAt)}</span>
                  </span>
                  {n.body && <span className="mt-0.5 block truncate text-xs text-muted-foreground">{n.body}</span>}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
