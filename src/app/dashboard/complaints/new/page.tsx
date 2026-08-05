import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ComplaintForm } from "@/components/dashboard/complaint-form";

export const dynamic = "force-dynamic";

export default async function NewComplaintPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="max-w-xl">
      <h1 className="font-display mb-6 text-2xl font-bold sm:text-3xl">Пожаловаться</h1>
      <ComplaintForm />
    </div>
  );
}
