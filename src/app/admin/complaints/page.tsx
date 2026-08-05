import { ComplaintsList } from "@/components/admin/complaints-list";

export const dynamic = "force-dynamic";

export default function AdminComplaintsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Жалобы</h1>
        <p className="mt-1 text-sm text-muted-foreground">Разбирайте споры между пользователями.</p>
      </div>
      <ComplaintsList />
    </div>
  );
}
