import Link from "next/link";
import { Flag } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const statusMap: Record<string, { label: string; className: string }> = {
  PENDING: { label: "На рассмотрении", className: "bg-amber-500/15 text-amber-400" },
  RESOLVED: { label: "Решена", className: "bg-emerald-500/15 text-emerald-400" },
  DISMISSED: { label: "Отклонена", className: "bg-muted text-muted-foreground" },
};

export default async function MyComplaintsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const complaints = await prisma.complaint.findMany({
    where: { reporterId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { target: { select: { name: true, isVerified: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Мои жалобы</h1>
          <p className="mt-1 text-sm text-muted-foreground">Отслеживайте статус обращений в поддержку</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/complaints/new">
            <Flag className="h-4 w-4" /> Подать жалобу
          </Link>
        </Button>
      </div>

      {complaints.length === 0 ? (
        <div className="rounded-3xl border border-border/80 bg-card/60 p-12 text-center">
          <p className="text-lg font-semibold">Жалоб пока нет</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Если возник спор с продавцом или покупателем — подайте жалобу, администрация разберётся.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {complaints.map((c) => (
            <div key={c.id} className="rounded-3xl border border-border/80 bg-card/60 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    На: {c.target.name} <span className="font-normal text-muted-foreground">· {c.reason}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(c.createdAt)}</p>
                </div>
                <Badge className={statusMap[c.status]?.className ?? ""}>{statusMap[c.status]?.label ?? c.status}</Badge>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{c.text}</p>
              {c.adminNote && (
                <p className="mt-3 rounded-xl bg-muted/40 px-4 py-2.5 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Ответ администрации:</span> {c.adminNote}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
