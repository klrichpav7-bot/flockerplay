"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { AppIcon } from "@/components/shared/app-icon";
import { Button } from "@/components/ui/button";

export function ImagePicker({
  value,
  onChange,
  accept = "image/png,image/jpeg,image/webp,image/gif,image/svg+xml",
}: {
  value: string;
  onChange: (v: string) => void;
  accept?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(f: File | undefined) {
    if (!f) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error((data && data.error) || "Ошибка загрузки");
      onChange(data.url);
      toast.success("Изображение загружено");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          void handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
        Загрузить
      </Button>
      {value && (
        <>
          <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-xl bg-muted/60">
            <AppIcon icon={value} className="h-5 w-5 object-contain" textClassName="text-lg" />
          </span>
          <button
            type="button"
            onClick={() => onChange("")}
            className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );
}
