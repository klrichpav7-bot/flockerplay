"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function OrderDeliver({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [deliveryText, setDeliveryText] = useState("");
  const [delivering, setDelivering] = useState(false);

  async function deliver() {
    if (!deliveryText.trim()) {
      toast.error("Введите данные для выдачи");
      return;
    }
    setDelivering(true);
    try {
      await api(`/api/orders/${orderId}/deliver`, { method: "POST", body: JSON.stringify({ deliveryInfo: deliveryText }) });
      toast.success("Товар отгружен покупателю");
      setDeliveryText("");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setDelivering(false);
    }
  }

  return (
    <div className="space-y-2">
      <Textarea
        rows={2}
        placeholder="Введите ключ, логин или инструкцию для покупателя…"
        value={deliveryText}
        onChange={(e) => setDeliveryText(e.target.value)}
      />
      <Button onClick={deliver} className="w-full sm:w-auto" disabled={delivering}>
        {delivering ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Отгрузить товар
      </Button>
    </div>
  );
}
