import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TopUpForm } from "@/components/dashboard/topup-form";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

const statusMap: Record<string, { label: string; className: string }> = {
  PENDING: { label: "В обработке", className: "bg-amber-500/15 text-amber-400" },
  APPROVED: { label: "Одобрено", className: "bg-emerald-500/15 text-emerald-400" },
  REJECTED: { label: "Отклонено", className: "bg-rose-500/15 text-rose-400" },
};

export default async function TopUpPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [user, topUps, tx] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id } }),
    prisma.topUpRequest.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" } }),
    prisma.balanceTransaction.findMany({
      where: { userId: session.user.id, type: { in: ["RECHARGE", "ADMIN"] } },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
  ]);

  if (!user) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Пополнение баланса</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Текущий баланс: <b className="text-emerald-400">{formatPrice(user.balance)}</b>
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TopUpForm />

        <div className="space-y-6">
          <div className="rounded-3xl border border-border/80 bg-card/60 p-6">
            <h2 className="mb-4 font-semibold">Мои заявки</h2>
            {topUps.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Заявок пока нет</p>
            ) : (
              <div className="space-y-2">
                {topUps.map((t) => (
                  <div key={t.id} className="rounded-2xl border border-border/60 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{formatPrice(t.amount)}</p>
                        <p className="text-xs text-muted-foreground">
                          {t.method} · {formatDate(t.createdAt)}
                        </p>
                      </div>
                      <Badge className={statusMap[t.status]?.className ?? ""}>{statusMap[t.status]?.label ?? t.status}</Badge>
                    </div>
                    {t.adminNote && <p className="mt-2 rounded-xl bg-muted/40 px-3 py-2 text-xs text-muted-foreground">{t.adminNote}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-border/80 bg-card/60 p-6">
            <h2 className="mb-4 font-semibold">История зачислений</h2>
            {tx.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Зачислений пока нет</p>
            ) : (
              <div className="space-y-2">
                {tx.map((t) => (
                  <div key={t.id} className="flex items-center justify-between rounded-2xl border border-border/60 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{t.reason ?? t.type}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(t.createdAt)}</p>
                    </div>
                    <span className="text-sm font-semibold text-emerald-400">+{formatPrice(t.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
