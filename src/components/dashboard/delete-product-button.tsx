"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";

export function DeleteProductButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function remove() {
    if (!confirm("Удалить этот товар навсегда?")) return;
    setLoading(true);
    try {
      await api(`/api/products/${id}`, { method: "DELETE" });
      toast.success("Товар удалён");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={remove}
      disabled={loading}
      className="grid h-9 w-9 place-items-center rounded-xl border border-border text-muted-foreground transition hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-400"
      aria-label="Удалить"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
    </button>
  );
}
