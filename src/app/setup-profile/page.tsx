import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ProfileSetupForm } from "@/components/auth/profile-setup-form";

export const metadata: Metadata = { title: "Настройка профиля" };

export const dynamic = "force-dynamic";

export default async function SetupProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!session.user.needsSetup) redirect("/dashboard");

  return (
    <div className="section flex min-h-[70vh] items-center justify-center py-16">
      <ProfileSetupForm />
    </div>
  );
}
