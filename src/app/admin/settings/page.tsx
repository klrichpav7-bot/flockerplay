import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { SettingsForm } from "@/components/admin/settings-form";
import { yoomoneyConfigured, yoomoneyWallet } from "@/lib/yoomoney";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const session = await auth();
  if (!session || session.user.role !== "ROLE_ADMIN") redirect("/dashboard");

  const settings = await prisma.siteSetting.findUnique({ where: { id: "main" } });

  if (!settings) redirect("/dashboard");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Настройки</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Комиссия платформы, лимиты пополнения и вывода, контакты поддержки.
        </p>
      </div>

      <div className="rounded-3xl border border-border/80 bg-card/60 p-6">
        <h2 className="font-semibold">Приём платежей ЮMoney</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Платежи через P2P-форму поступают напрямую на кошелёк администратора. Зачисление — вручную на странице «Платежи ЮMoney».
        </p>
        {yoomoneyConfigured() ? (
          <p className="mt-2 inline-flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-400">
            Шлюз настроен · приём на кошелёк <b>{yoomoneyWallet()}</b>
          </p>
        ) : (
          <p className="mt-2 inline-flex items-center gap-2 rounded-xl bg-amber-500/10 px-3 py-1.5 text-sm font-medium text-amber-400">
            Шлюз не настроен — задайте YOOMONEY_WALLET в .env
          </p>
        )}
      </div>

      <SettingsForm
        settings={{
          commission: settings.commission,
          minTopUp: settings.minTopUp,
          minWithdrawal: settings.minWithdrawal,
          starsRate: settings.starsRate,
          starsMin: settings.starsMin,
          starsMax: settings.starsMax,
          supportEmail: settings.supportEmail,
          telegram: settings.telegram,
          vk: settings.vk,
          discord: settings.discord,
        }}
      />
    </div>
  );
}
