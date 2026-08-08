"use client";

import { useState } from "react";
import { CheckCheck, ClipboardCopy, Eye, EyeOff, KeyRound } from "lucide-react";
import { toast } from "sonner";

export function OrderDataReveal({ deliveryInfo }: { deliveryInfo: string }) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(deliveryInfo);
    setCopied(true);
    toast.success("Данные скопированы");
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="rounded-3xl border border-emerald-500/25 bg-emerald-500/5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-emerald-400">
          <KeyRound className="h-4 w-4" /> Данные товара
        </h3>
        <button
          type="button"
          onClick={() => setRevealed((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/15 px-3 py-2 text-sm font-semibold text-emerald-400 transition hover:bg-emerald-500/25"
        >
          {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {revealed ? "Скрыть данные" : "Данные товара раскрыть"}
        </button>
      </div>

      {!revealed ? (
        <p className="mt-3 select-none rounded-2xl bg-black/30 px-4 py-4 text-center font-mono tracking-[0.3em] text-emerald-200/40">
          • • • • • • • • • • • • • • • •
        </p>
      ) : (
        <>
          <pre className="mt-3 select-all whitespace-pre-wrap break-all rounded-2xl bg-black/30 px-4 py-4 font-mono text-sm leading-relaxed text-emerald-200">
            {deliveryInfo}
          </pre>
          <button
            type="button"
            onClick={copy}
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-black/30 px-3 py-2 text-sm font-medium text-emerald-400 transition hover:bg-black/50"
          >
            {copied ? <CheckCheck className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />}
            {copied ? "Скопировано" : "Копировать"}
          </button>
        </>
      )}
    </div>
  );
}
