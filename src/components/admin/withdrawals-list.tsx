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

interface AdminWithdrawal {
  id: string;
  amount: number;
  method: string;
  details: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminNote: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string; isVerified: boolean };
}

const statusLabel: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Ждёт выплаты", className: "bg-amber-500/15 text-amber-400" },
  APPROVED: { label: "Выплачено", className: "bg-emerald-500/15 text-emerald-400" },
  REJECTED: { label: "Отклонено", className: "bg-rose-500/15 text-rose-400" },
};

export function WithdrawalsList() {
  const [items, setItems] = useState<AdminWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState<AdminWithdrawal | null>(null);
  const [note, setNote] = useState("");
  const [action, setAction] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await api<{ withdrawals: AdminWithdrawal[] }>("/api/admin/withdrawals");
      setItems(d.withdrawals);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openReview(w: AdminWithdrawal, a: "APPROVE" | "REJECT") {
    setTarget(w);
    setAction(a);
    setNote("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!target || submitting) return;
    setSubmitting(true);
    try {
      await api(`/api/admin/withdrawals/${target.id}`, {
        method: "POST",
        body: JSON.stringify({ action, adminNote: note }),
      });
      toast.success(action === "APPROVE" ? "Вывод подтверждён" : "Вывод отклонён, средства возвращены");
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
          Заявок на вывод нет
        </p>
      ) : (
        items.map((w) => (
          <div key={w.id} className="flex flex-wrap items-center gap-4 rounded-3xl border border-border/80 bg-card/60 p-5">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">
                {w.user.name} {w.user.isVerified && <VerifiedBadge size="xs" />}
              </p>
              <p className="text-xs text-muted-foreground">
                {w.user.email} · {formatDate(w.createdAt)}
              </p>
              <div className="mt-2 rounded-2xl border border-border/60 bg-black/20 px-3 py-2">
                <p className="text-xs text-muted-foreground">Способ: <span className="font-medium text-foreground">{w.method}</span></p>
                <p className="break-all text-sm font-semibold text-foreground">{w.details}</p>
              </div>
              {w.adminNote && <p className="mt-1 text-xs text-muted-foreground">Комментарий: {w.adminNote}</p>}
            </div>
            <div className="text-right">
              <p className="font-display text-lg font-bold">{formatPrice(w.amount)}</p>
              <Badge className={statusLabel[w.status]?.className ?? ""}>{statusLabel[w.status]?.label ?? w.status}</Badge>
            </div>
            {w.status === "PENDING" && (
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => openReview(w, "APPROVE")}>
                  <Check className="h-3.5 w-3.5" /> Выплачено
                </Button>
                <Button variant="outline" size="sm" onClick={() => openReview(w, "REJECT")}>
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
            <DialogTitle>{action === "APPROVE" ? "Подтвердить выплату" : "Отклонить вывод"}</DialogTitle>
            <DialogDescription>
              {target?.user.name} · {formatPrice(target?.amount ?? 0)} · {target?.method}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            {action === "APPROVE" && (
              <p className="rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
                Реквизиты: <b className="break-all">{target?.details}</b>. Средства уже зарезервированы у пользователя —
                переведите сумму вручную, затем подтвердите здесь.
              </p>
            )}
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
              {action === "APPROVE" ? "Подтвердить выплату" : "Отклонить и вернуть средства"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
