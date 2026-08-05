import { BannersList } from "@/components/admin/banners-list";

export const dynamic = "force-dynamic";

export default function AdminBannersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Модерация баннеров</h1>
        <p className="mt-1 text-sm text-muted-foreground">Активируйте рекламу на главной, в каталоге или в сайдбаре.</p>
      </div>
      <BannersList />
    </div>
  );
}
