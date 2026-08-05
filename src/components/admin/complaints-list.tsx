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
import { formatDate } from "@/lib/format";

interface AdminComplaint {
  id: string;
  reason: string;
  text: string | null;
  status: "PENDING" | "RESOLVED" | "DISMISSED";
  adminNote: string | null;
  createdAt: string;
  reporter: { id: string; name: string };
  target: { id: string; name: string; isVerified: boolean };
  orderId: string | null;
}

const statusLabel: Record<string, { label: string; className: string }> = {
  PENDING: { label: "На рассмотрении", className: "bg-amber-500/15 text-amber-400" },
  RESOLVED: { label: "Решена", className: "bg-emerald-500/15 text-emerald-400" },
  DISMISSED: { label: "Отклонена", className: "bg-muted text-muted-foreground" },
};

export function ComplaintsList() {
  const [items, setItems] = useState<AdminComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState<AdminComplaint | null>(null);
  const [action, setAction] = useState<"RESOLVE" | "DISMISS">("RESOLVE");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await api<{ complaints: AdminComplaint[] }>("/api/admin/complaints");
      setItems(d.complaints);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openReview(c: AdminComplaint, a: "RESOLVE" | "DISMISS") {
    setTarget(c);
    setAction(a);
    setNote("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!target || submitting) return;
    setSubmitting(true);
    try {
      await api(`/api/admin/complaints/${target.id}`, {
        method: "POST",
        body: JSON.stringify({ action, adminNote: note }),
      });
      toast.success("Жалоба обработана");
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
          Жалоб нет
        </p>
      ) : (
        items.map((c) => (
          <div key={c.id} className="rounded-3xl border border-border/80 bg-card/60 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold">
                {c.reporter.name} → {c.target.name} {c.target.isVerified && <VerifiedBadge size="xs" />}
                <span className="ml-2 font-normal text-muted-foreground">· {c.reason}</span>
              </p>
              <Badge className={statusLabel[c.status]?.className ?? ""}>{statusLabel[c.status]?.label ?? c.status}</Badge>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{c.text}</p>
            {c.orderId && (
              <p className="mt-1 text-xs text-muted-foreground">Заказ {c.orderId.slice(0, 8)}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">{formatDate(c.createdAt)}</p>
            {c.adminNote && (
              <p className="mt-2 rounded-xl bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Ответ:</span> {c.adminNote}
              </p>
            )}
            {c.status === "PENDING" && (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" onClick={() => openReview(c, "RESOLVE")}>
                  <Check className="h-3.5 w-3.5" /> Решить
                </Button>
                <Button variant="outline" size="sm" onClick={() => openReview(c, "DISMISS")}>
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
            <DialogTitle>{action === "RESOLVE" ? "Решить жалобу" : "Отклонить жалобу"}</DialogTitle>
            <DialogDescription>
              {target?.reporter.name} на {target?.target.name} · {target?.reason}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Textarea
                rows={3}
                placeholder="Ответ заявителю (необязательно)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" variant={action === "DISMISS" ? "destructive" : "default"} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Подтвердить
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
