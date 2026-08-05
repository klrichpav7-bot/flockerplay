import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SupportChat } from "@/components/support/support-chat";

export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 py-8">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Поддержка</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Задайте вопрос или сообщите о проблеме — мы на связи.
        </p>
      </div>
      <SupportChat userId={session.user.id} userName={session.user.name ?? "Вы"} />
    </div>
  );
}
