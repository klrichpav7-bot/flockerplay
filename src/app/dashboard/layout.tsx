import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="section grid gap-8 py-10 lg:grid-cols-[15rem_1fr]">
      <DashboardNav />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
