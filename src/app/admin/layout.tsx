import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/admin-nav";
import { isAdmin } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!isAdmin(session)) redirect("/dashboard");

  return (
    <div className="section grid gap-8 py-10 lg:grid-cols-[15rem_1fr]">
      <AdminNav />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
