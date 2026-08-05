"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, EyeOff, Loader2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";

interface AdminBanner {
  id: string;
  title: string;
  imageUrl: string | null;
  linkUrl: string | null;
  placement: string;
  status: "PENDING" | "ACTIVE" | "HIDDEN";
  createdAt: string;
  owner: { id: string; name: string };
}

const statusLabel: Record<string, { label: string; className: string }> = {
  PENDING: { label: "На модерации", className: "bg-amber-500/15 text-amber-400" },
  ACTIVE: { label: "Активен", className: "bg-emerald-500/15 text-emerald-400" },
  HIDDEN: { label: "Скрыт", className: "bg-muted text-muted-foreground" },
};

const placementLabel: Record<string, string> = {
  HOME: "Главная",
  CATALOG: "Каталог",
  SIDEBAR: "Сайдбар",
};

export function BannersList() {
  const [items, setItems] = useState<AdminBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const d = await api<{ banners: AdminBanner[] }>("/api/admin/banners");
      setItems(d.banners);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function patch(b: AdminBanner, status: string) {
    setBusy(b.id);
    try {
      await api(`/api/admin/banners/${b.id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3">
      {loading ? (
        <Loader2 className="mx-auto my-14 h-6 w-6 animate-spin text-muted-foreground" />
      ) : items.length === 0 ? (
        <p className="rounded-3xl border border-border/80 bg-card/60 py-14 text-center text-sm text-muted-foreground">
          Баннеров нет
        </p>
      ) : (
        items.map((b) => (
          <div key={b.id} className="overflow-hidden rounded-3xl border border-border/80 bg-card/60">
            {b.imageUrl && <img src={b.imageUrl} alt={b.title} className="h-32 w-full object-cover" />}
            <div className="flex flex-wrap items-center gap-4 px-5 py-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{b.title}</p>
                <p className="text-xs text-muted-foreground">
                  {b.owner.name} · {placementLabel[b.placement] ?? b.placement} · {formatDate(b.createdAt)}
                </p>
                {b.linkUrl && <p className="text-xs text-sky-400">{b.linkUrl}</p>}
              </div>
              <Badge className={statusLabel[b.status]?.className ?? ""}>{statusLabel[b.status]?.label ?? b.status}</Badge>
              <div className="flex flex-wrap gap-1.5">
                {b.status !== "ACTIVE" && (
                  <Button variant="secondary" size="sm" onClick={() => patch(b, "ACTIVE")} disabled={busy === b.id}>
                    <Check className="h-3.5 w-3.5" /> Активировать
                  </Button>
                )}
                {b.status !== "HIDDEN" && (
                  <Button variant="outline" size="sm" onClick={() => patch(b, "HIDDEN")} disabled={busy === b.id}>
                    <EyeOff className="h-3.5 w-3.5" /> Скрыть
                  </Button>
                )}
                {b.status !== "PENDING" && (
                  <Button variant="ghost" size="sm" onClick={() => patch(b, "PENDING")} disabled={busy === b.id}>
                    <Undo2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
