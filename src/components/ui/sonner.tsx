"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      theme="dark"
      position="top-right"
      toastOptions={{
        className: "glass-strong rounded-2xl border-border text-foreground",
        style: { background: "hsl(var(--popover) / 0.96)", backdropFilter: "blur(16px)" },
      }}
    />
  );
}
