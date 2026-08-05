import { TopUpsList } from "@/components/admin/topups-list";

export const dynamic = "force-dynamic";

export default function AdminTopUpsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Пополнения баланса</h1>
        <p className="mt-1 text-sm text-muted-foreground">Проверяйте переводы и начисляйте средства пользователям.</p>
      </div>
      <TopUpsList />
    </div>
  );
}
