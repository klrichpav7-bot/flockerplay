import { UsersTable } from "@/components/admin/users-table";

export const dynamic = "force-dynamic";

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Пользователи</h1>
        <p className="mt-1 text-sm text-muted-foreground">Верификация, блокировка, баланс и роли.</p>
      </div>
      <UsersTable />
    </div>
  );
}
