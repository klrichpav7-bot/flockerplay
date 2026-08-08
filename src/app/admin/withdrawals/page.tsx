import { WithdrawalsList } from "@/components/admin/withdrawals-list";

export const dynamic = "force-dynamic";

export default function AdminWithdrawalsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Выплаты</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Заявки на вывод средств. Средства зарезервированы у пользователей — переведите их вручную на указанные реквизиты и подтвердите.
        </p>
      </div>
      <WithdrawalsList />
    </div>
  );
}
