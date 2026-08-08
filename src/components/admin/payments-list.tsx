"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice, formatDate } from "@/lib/format";

interface AdminPayment {
  id: string;
  amount: number;
  provider: string;
  status: "PENDING" | "SUCCEEDED" | "FAILED" | "CANCELED";
  createdAt: string;
  user: { id: string; name: string; email: string };
}

const statusLabel: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Ожидает проверки", className: "bg-amber-500/15 text-amber-400" },
  SUCCEEDED: { label: "Зачислено", className: "bg-emerald-500/15 text-emerald-400" },
  FAILED: { label: "Отклонено", className: "bg-rose-500/15 text-rose-400" },
  CANCELED: { label: "Отменено", className: "bg-muted text-muted-foreground" },
};

export function PaymentsList() {
  const [items, setItems] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const d = await api<{ payments: AdminPayment[] }>("/api/admin/payments");
      setItems(d.payments);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function act(p: AdminPayment, action: "CONFIRM" | "REJECT") {
    setBusyId(p.id);
    try {
      await api(`/api/admin/payments/${p.id}`, {
        method: "POST",
        body: JSON.stringify({ action }),
      });
      toast.success(action === "CONFIRM" ? `Баланс пополнен на ${formatPrice(p.amount)}` : "Платёж отклонён");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-3">
      {loading ? (
        <Loader2 className="mx-auto my-14 h-6 w-6 animate-spin text-muted-foreground" />
      ) : items.length === 0 ? (
        <p className="rounded-3xl border border-border/80 bg-card/60 py-14 text-center text-sm text-muted-foreground">
          Платежей пока нет
        </p>
      ) : (
        items.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center gap-4 rounded-3xl border border-border/80 bg-card/60 p-5">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{p.user.name}</p>
              <p className="text-xs text-muted-foreground">
                {p.user.email} · {formatDate(p.createdAt)}
              </p>
              {p.status === "PENDING" && (
                <p className="mt-2 rounded-xl bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
                  Проверьте, что деньги поступили на кошелёк ЮMoney, затем подтвердите зачисление.
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="font-display text-lg font-bold">{formatPrice(p.amount)}</p>
              <Badge className={statusLabel[p.status]?.className ?? ""}>{statusLabel[p.status]?.label ?? p.status}</Badge>
            </div>
            {p.status === "PENDING" && (
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" disabled={busyId === p.id} onClick={() => act(p, "CONFIRM")}>
                  {busyId === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Зачислить
                </Button>
                <Button variant="outline" size="sm" disabled={busyId === p.id} onClick={() => act(p, "REJECT")}>
                  <X className="h-3.5 w-3.5" /> Отклонить
                </Button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
