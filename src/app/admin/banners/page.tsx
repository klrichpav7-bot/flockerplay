import { BannerManager } from "@/components/admin/banner-manager";

export const dynamic = "force-dynamic";

export default function AdminBannersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Баннеры</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Слайдер на главной: автопрокрутка со скоростью из поля «Слайд, мс» у каждого баннера.
        </p>
      </div>
      <BannerManager />
    </div>
  );
}
