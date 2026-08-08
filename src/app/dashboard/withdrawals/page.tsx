import Link from "next/link";
import { Clock, Lock, Wallet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { releaseMaturedFunds } from "@/lib/finance";
import { formatPrice, formatDate } from "@/lib/format";
import { WithdrawalForm } from "@/components/dashboard/withdrawal-form";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

const statusMap: Record<string, { label: string; className: string }> = {
  PENDING: { label: "В обработке", className: "bg-amber-500/15 text-amber-400" },
  APPROVED: { label: "Оплачено", className: "bg-emerald-500/15 text-emerald-400" },
  REJECTED: { label: "Отклонено", className: "bg-rose-500/15 text-rose-400" },
};

export default async function WithdrawalsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await releaseMaturedFunds();

  const [user, withdrawals, settings] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id } }),
    prisma.withdrawal.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" } }),
    prisma.siteSetting.findUnique({ where: { id: "main" } }),
  ]);

  if (!user) redirect("/login");

  const minWithdrawal = settings?.minWithdrawal ?? 100;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Вывод средств</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Средства с продаж замораживаются на 3 дня после подтверждения сделки, затем становятся доступны для вывода.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-emerald-500/25 bg-emerald-500/10 p-5">
          <Wallet className="h-5 w-5 text-emerald-400" />
          <p className="mt-3 text-2xl font-bold text-emerald-400">{formatPrice(user.balance)}</p>
          <p className="text-xs text-muted-foreground">Доступно к выводу</p>
        </div>
        <div className="rounded-3xl border border-amber-500/25 bg-amber-500/10 p-5">
          <Lock className="h-5 w-5 text-amber-400" />
          <p className="mt-3 text-2xl font-bold text-amber-400">{formatPrice(user.heldBalance)}</p>
          <p className="text-xs text-muted-foreground">Заморожено на 3 дня</p>
        </div>
        <div className="rounded-3xl border border-border bg-card/60 p-5">
          <Clock className="h-5 w-5 text-sky-400" />
          <p className="mt-3 text-2xl font-bold">до 24 ч</p>
          <p className="text-xs text-muted-foreground">Срок обработки вывода</p>
        </div>
      </div>

      <div className="rounded-3xl border border-sky-500/25 bg-sky-500/5 p-5 text-sm text-muted-foreground">
        После отправки заявки средства резервируются. Вывод обрабатывается администратором <b>в течение 24 часов</b> —
        перевод выполняется вручную на указанные реквизиты. Заявки и их статус можно отслеживать ниже.
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <WithdrawalForm balance={user.balance} minWithdrawal={minWithdrawal} />

        <div className="rounded-3xl border border-border/80 bg-card/60 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Мои заявки на вывод</h2>
            <Link href="/dashboard/sales" className="text-xs font-medium text-sky-400 hover:text-sky-300">
              Кабинет продавца
            </Link>
          </div>
          {withdrawals.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Заявок пока нет. Они появятся после того, как закончится заморозка средств.
            </p>
          ) : (
            <div className="space-y-2">
              {withdrawals.map((w) => (
                <div key={w.id} className="rounded-2xl border border-border/60 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{formatPrice(w.amount)}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {w.method} · {w.details} · {formatDate(w.createdAt)}
                      </p>
                    </div>
                    <Badge className={statusMap[w.status]?.className ?? ""}>{statusMap[w.status]?.label ?? w.status}</Badge>
                  </div>
                  {w.adminNote && <p className="mt-2 rounded-xl bg-muted/40 px-3 py-2 text-xs text-muted-foreground">{w.adminNote}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
