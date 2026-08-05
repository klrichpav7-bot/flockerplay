import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BannerForm } from "@/components/dashboard/banner-form";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const statusMap: Record<string, { label: string; className: string }> = {
  PENDING: { label: "На модерации", className: "bg-amber-500/15 text-amber-400" },
  ACTIVE: { label: "Активен", className: "bg-emerald-500/15 text-emerald-400" },
  HIDDEN: { label: "Скрыт", className: "bg-muted text-muted-foreground" },
};

const placementLabel: Record<string, string> = {
  HOME: "Главная",
  CATALOG: "Каталог",
  SIDEBAR: "Сайдбар",
};

export default async function BannersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const banners = await prisma.banner.findMany({
    where: { ownerId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Реклама на сайте</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Размещайте рекламные баннеры. Каждый баннер проходит модерацию.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <BannerForm />

        <div className="rounded-3xl border border-border/80 bg-card/60 p-6">
          <h2 className="mb-4 font-semibold">Мои баннеры</h2>
          {banners.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Баннеров пока нет</p>
          ) : (
            <div className="space-y-3">
              {banners.map((b) => (
                <div key={b.id} className="overflow-hidden rounded-2xl border border-border/60">
                  {b.imageUrl && <img src={b.imageUrl} alt={b.title} className="h-28 w-full object-cover" />}
                  <div className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{b.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {placementLabel[b.placement] ?? b.placement} · {formatDate(b.createdAt)}
                      </p>
                    </div>
                    <Badge className={statusMap[b.status]?.className ?? ""}>{statusMap[b.status]?.label ?? b.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
