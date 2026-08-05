import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminSupport } from "@/components/admin/admin-support";

export const dynamic = "force-dynamic";

export default async function AdminTicketsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Поддержка</h1>
        <p className="mt-1 text-sm text-muted-foreground">Отвечайте на обращения пользователей в реальном времени.</p>
      </div>
      <AdminSupport adminId={session.user.id} adminName={session.user.name ?? "Поддержка"} />
    </div>
  );
}
