"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { VerifiedBadge } from "@/components/shared/verified-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice, formatDate } from "@/lib/format";

interface AdminTopUp {
  id: string;
  amount: number;
  method: string | null;
  comment: string | null;
  proofUrl: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminNote: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string; isVerified: boolean };
}

const statusLabel: Record<string, { label: string; className: string }> = {
  PENDING: { label: "На проверке", className: "bg-amber-500/15 text-amber-400" },
  APPROVED: { label: "Одобрено", className: "bg-emerald-500/15 text-emerald-400" },
  REJECTED: { label: "Отклонено", className: "bg-rose-500/15 text-rose-400" },
};

export function TopUpsList() {
  const [items, setItems] = useState<AdminTopUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [target, setTarget] = useState<AdminTopUp | null>(null);
  const [note, setNote] = useState("");
  const [action, setAction] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await api<{ topUps: AdminTopUp[] }>("/api/admin/topups");
      setItems(d.topUps);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openReview(t: AdminTopUp, a: "APPROVE" | "REJECT") {
    setTarget(t);
    setAction(a);
    setNote("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!target || submitting) return;
    setSubmitting(true);
    try {
      await api(`/api/admin/topups/${target.id}`, {
        method: "POST",
        body: JSON.stringify({ action, adminNote: note }),
      });
      toast.success(action === "APPROVE" ? "Пополнение одобрено" : "Пополнение отклонено");
      setTarget(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-3">
      {loading ? (
        <Loader2 className="mx-auto my-14 h-6 w-6 animate-spin text-muted-foreground" />
      ) : items.length === 0 ? (
        <p className="rounded-3xl border border-border/80 bg-card/60 py-14 text-center text-sm text-muted-foreground">
          Заявок на пополнение нет
        </p>
      ) : (
        items.map((t) => (
          <div key={t.id} className="flex flex-wrap items-center gap-4 rounded-3xl border border-border/80 bg-card/60 p-5">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">
                {t.user.name} {t.user.isVerified && <VerifiedBadge size="xs" />}
              </p>
              <p className="text-xs text-muted-foreground">
                {t.user.email} · {t.method ?? "Ручная проверка"} · {formatDate(t.createdAt)}
              </p>
              {t.comment && <p className="mt-1 text-sm text-muted-foreground">«{t.comment}»</p>}
              {t.proofUrl && (
                <a href={t.proofUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-sky-400 underline">
                  Смотреть подтверждение
                </a>
              )}
              {t.adminNote && <p className="mt-1 text-xs text-muted-foreground">Комментарий: {t.adminNote}</p>}
            </div>
            <div className="text-right">
              <p className="font-display text-lg font-bold">{formatPrice(t.amount)}</p>
              <Badge className={statusLabel[t.status]?.className ?? ""}>{statusLabel[t.status]?.label ?? t.status}</Badge>
            </div>
            {t.status === "PENDING" && (
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => openReview(t, "APPROVE")} disabled={busy === t.id}>
                  <Check className="h-3.5 w-3.5" /> Одобрить
                </Button>
                <Button variant="outline" size="sm" onClick={() => openReview(t, "REJECT")} disabled={busy === t.id}>
                  <X className="h-3.5 w-3.5" /> Отклонить
                </Button>
              </div>
            )}
          </div>
        ))
      )}

      <Dialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{action === "APPROVE" ? "Одобрить" : "Отклонить"} пополнение</DialogTitle>
            <DialogDescription>
              {target?.user.name} · {formatPrice(target?.amount ?? 0)}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Textarea
                rows={3}
                placeholder="Комментарий для пользователя (необязательно)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" variant={action === "REJECT" ? "destructive" : "default"} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {action === "APPROVE" ? "Одобрить и начислить" : "Отклонить"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
