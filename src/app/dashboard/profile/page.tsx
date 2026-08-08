import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ProfileSettings } from "@/components/auth/profile-settings";

export const metadata: Metadata = { title: "Профиль" };

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Профиль</h1>
        <p className="mt-1 text-sm text-muted-foreground">Никнейм, фото и безопасность аккаунта</p>
      </div>
      <ProfileSettings />
    </div>
  );
}
