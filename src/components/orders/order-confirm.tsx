"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function OrderConfirm({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function confirm() {
    if (submitting) return;
    setSubmitting(true);
    try {
      await api(`/api/orders/${orderId}/complete`, {
        method: "POST",
        body: JSON.stringify({ rating, comment }),
      });
      toast.success("Заказ завершён, спасибо за отзыв!");
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="secondary" className="w-full sm:w-auto">
        <CheckCircle2 className="h-4 w-4" /> Подтвердить получение
      </Button>

      <Dialog open={open} onOpenChange={(o) => !o && setOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Подтвердить получение</DialogTitle>
            <DialogDescription>
              Оцените сделку. После подтверждения средства продавца будут заморожены на 3 дня, а продавец получит вашу оценку.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-1.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  className="rounded-lg p-1 transition hover:scale-110"
                  aria-label={`Оценка ${s}`}
                >
                  <Star className={cn("h-7 w-7", s <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")} />
                </button>
              ))}
            </div>
            <Textarea
              rows={3}
              placeholder="Комментарий к отзыву (необязательно)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <Button onClick={confirm} className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Подтвердить заказ
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
