import { PromoManager } from "@/components/admin/promo-manager";

export const dynamic = "force-dynamic";

export default function AdminPromosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Промокоды</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Создавайте коды на пополнение баланса и скидки. Пользователи активируют их в личном кабинете.
        </p>
      </div>
      <PromoManager />
    </div>
  );
}
