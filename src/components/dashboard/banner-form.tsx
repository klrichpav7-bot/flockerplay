"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Megaphone } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { ImageUploader } from "@/components/shared/image-uploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const placements = [
  { value: "HOME", label: "Главная страница" },
  { value: "CATALOG", label: "Каталог" },
  { value: "SIDEBAR", label: "Сайдбар" },
];

export function BannerForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [placement, setPlacement] = useState("HOME");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !imageUrl) {
      toast.error("Заполните название и добавьте изображение");
      return;
    }
    setLoading(true);
    try {
      await api("/api/banners", { method: "POST", body: JSON.stringify({ title, imageUrl, linkUrl, placement }) });
      toast.success("Баннер отправлен на модерацию");
      setTitle("");
      setImageUrl("");
      setLinkUrl("");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5 rounded-3xl border border-border/80 bg-card/60 p-6">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Megaphone className="h-4 w-4 text-primary" /> Рекламный баннер
      </div>

      <div className="space-y-2">
        <Label htmlFor="b-title">Название баннера</Label>
        <Input id="b-title" placeholder="Сезонная распродажа" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label>Изображение</Label>
        <ImageUploader value={imageUrl} onChange={setImageUrl} label="Загрузить баннер (1600×400)" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="b-placement">Позиция</Label>
          <select
            id="b-placement"
            value={placement}
            onChange={(e) => setPlacement(e.target.value)}
            className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary/60"
          >
            {placements.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="b-link">Ссылка (необязательно)</Label>
          <Input id="b-link" placeholder="/catalog" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Отправить на модерацию
      </Button>
    </form>
  );
}
