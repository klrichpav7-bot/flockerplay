import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { NotificationsPage } from "@/components/shared/notifications-page";

export const dynamic = "force-dynamic";

export default async function DashboardNotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="mx-auto max-w-3xl">
      <NotificationsPage />
    </div>
  );
}
