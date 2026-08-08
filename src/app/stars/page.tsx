import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { StarsBuy } from "@/components/stars/stars-buy";
import { findStarsProduct, starsPrice } from "@/lib/stars";

export const dynamic = "force-dynamic";

export default async function StarsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const sp = await searchParams;
  const paymentId = sp.payment ?? null;
  let paymentStatus: "PENDING" | "SUCCEEDED" | "FAILED" | null = null;
  if (paymentId) {
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (payment?.userId === session.user.id && ["SUCCEEDED", "FAILED", "PENDING"].includes(payment.status)) {
      paymentStatus = payment.status as "PENDING" | "SUCCEEDED" | "FAILED";
    }
  }

  const [settings, product, user] = await Promise.all([
    prisma.siteSetting.findUnique({ where: { id: "main" } }),
    findStarsProduct(),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { balance: true } }),
  ]);

  const rate = settings?.starsRate ?? 150;

  return (
    <div className="section py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-bold sm:text-4xl">ТГ-звёзды</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
            Официальные звёзды Telegram для реакций, подарков и платных подписок. Покупка за пару кликов.
          </p>
        </div>

        {paymentStatus && (
          <div
            className={
              paymentStatus === "SUCCEEDED"
                ? "mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-300"
                : paymentStatus === "FAILED"
                  ? "mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-300"
                  : "mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-sm text-amber-300"
            }
          >
            {paymentStatus === "SUCCEEDED" && "Платёж принят. Заказ находится в обработке, звёзды будут доставлены в ближайшее время."}
            {paymentStatus === "FAILED" && "Платёж не прошёл или был отменён. Попробуйте ещё раз."}
            {paymentStatus === "PENDING" && "Платёж обрабатывается. Как только он будет подтверждён, заказ перейдёт в работу."}
          </div>
        )}

        {!product ? (
          <div className="rounded-3xl border border-border/70 bg-card/60 p-12 text-center">
            <p className="text-lg font-semibold">Раздел ещё настраивается</p>
            <p className="mt-2 text-sm text-muted-foreground">Продавец звёзд скоро подключится. Загляните позже.</p>
            <Link href="/catalog" className="mt-5 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90">
              В каталог
            </Link>
          </div>
        ) : (
          <StarsBuy
            initial={{
              rate,
              pricePerStar: starsPrice(1, rate) / 100,
              min: settings?.starsMin ?? 100,
              max: settings?.starsMax ?? 100000,
              product: {
                id: product.id,
                title: product.title,
                sellerId: product.sellerId,
                deliveryType: product.deliveryType,
                deliveryInfo: product.deliveryInfo,
              },
              balance: user?.balance ?? 0,
            }}
          />
        )}
      </div>
    </div>
  );
}
