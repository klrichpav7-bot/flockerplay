import { PaymentsList } from "@/components/admin/payments-list";

export const dynamic = "force-dynamic";

export default function AdminPaymentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Платежи ЮMoney</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Переводы через P2P-форму ЮMoney. Деньги приходят на кошелёк администратора — после проверки поступления подтвердите зачисление.
        </p>
      </div>
      <PaymentsList />
    </div>
  );
}
