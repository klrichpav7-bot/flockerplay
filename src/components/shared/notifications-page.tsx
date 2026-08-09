"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, CheckCheck, Inbox, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/format";
import { Button } from "@/components/ui/button";

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

export function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const d = await api<{ notifications: NotificationItem[] }>("/api/notifications");
      setItems(d.notifications);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function markAll() {
    await api("/api/notifications/read", { method: "POST" }).catch(() => {});
    setItems((prev) => prev.map((i) => ({ ...i, isRead: true })));
  }

  const unread = items.filter((i) => !i.isRead).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Уведомления</h1>
        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={markAll}>
            <CheckCheck className="h-3.5 w-3.5" /> Прочитать все
          </Button>
        )}
      </div>

      {loading ? (
        <Loader2 className="mx-auto my-14 h-6 w-6 animate-spin text-muted-foreground" />
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-3xl border border-border/80 bg-card/60 px-4 py-14 text-center">
          <Inbox className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Уведомлений пока нет</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border/80 bg-card/60">
          {items.map((n) => (
            <button
              key={n.id}
              onClick={() => {
                api(`/api/notifications/${n.id}/read`, { method: "POST" }).catch(() => {});
                setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, isRead: true } : i)));
              }}
              className={cn(
                "flex w-full gap-3 border-b border-border/60 px-4 py-3.5 text-left transition hover:bg-muted/40",
                !n.isRead && "bg-primary/5"
              )}
            >
              <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", typeColor[n.type] ?? "bg-sky-500")} />
              <span className="min-w-0">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">{n.title}</span>
                  <span className="shrink-0 text-[11px] text-muted-foreground">{timeAgo(n.createdAt)}</span>
                </span>
                {n.body && <span className="mt-0.5 block text-xs text-muted-foreground">{n.body}</span>}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
