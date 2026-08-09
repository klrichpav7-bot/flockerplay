"use client";

import { useCallback, useEffect, useState } from "react";
import { Coins, Loader2, RefreshCw, Search, ShieldCheck, ShieldOff, Ban, UserCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { VerifiedBadge } from "@/components/shared/verified-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { formatPrice, initials, formatDate } from "@/lib/format";
import { UserCardDialog } from "@/components/admin/user-card";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "ROLE_USER" | "ROLE_ADMIN";
  avatarUrl: string | null;
  isSeller: boolean;
  isVerified: boolean;
  isBlocked: boolean;
  balance: number;
  createdAt: string;
  _count: { products: number; orders: number; soldOrders: number };
}

export function UsersTable() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [balanceTarget, setBalanceTarget] = useState<AdminUser | null>(null);
  const [cardTarget, setCardTarget] = useState<AdminUser | null>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [balanceLoading, setBalanceLoading] = useState(false);

  const load = useCallback(async (query?: string, sellerOnly?: boolean) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (sellerOnly) params.set("seller", "true");
      const d = await api<{ users: AdminUser[] }>(`/api/admin/users?${params.toString()}`);
      setUsers(d.users);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function patch(user: AdminUser, data: Record<string, unknown>) {
    setBusy(user.id);
    try {
      await api(`/api/admin/users/${user.id}`, { method: "PATCH", body: JSON.stringify(data) });
      await load(q);
      toast.success("Сохранено");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(null);
    }
  }

  async function adjustBalance(e: React.FormEvent) {
    e.preventDefault();
    if (!balanceTarget || balanceLoading) return;
    const value = Number(amount);
    if (!Number.isFinite(value) || value === 0) {
      toast.error("Введите ненулевую сумму");
      return;
    }
    setBalanceLoading(true);
    try {
      await api(`/api/admin/users/${balanceTarget.id}/balance`, {
        method: "POST",
        body: JSON.stringify({ amount: value, reason }),
      });
      toast.success("Баланс изменён");
      setBalanceTarget(null);
      setAmount("");
      setReason("");
      await load(q);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBalanceLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск по имени или email…"
            className="pl-10"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load(q)}
          />
        </div>
        <Button variant="secondary" onClick={() => load(q)}>
          <RefreshCw className="h-4 w-4" /> Обновить
        </Button>
      </div>

      <div className="overflow-hidden rounded-3xl border border-border/80 bg-card/60">
        {loading ? (
          <Loader2 className="mx-auto my-14 h-6 w-6 animate-spin text-muted-foreground" />
        ) : users.length === 0 ? (
          <p className="py-14 text-center text-sm text-muted-foreground">Пользователи не найдены</p>
        ) : (
          <div className="divide-y divide-border/60">
            {users.map((u) => (
              <div key={u.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={u.avatarUrl ?? undefined} />
                  <AvatarFallback className="text-xs">{initials(u.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-sm font-semibold">
                    {u.name} {u.isVerified && <VerifiedBadge size="xs" />}
                    {u.role === "ROLE_ADMIN" && (
                      <Badge className="bg-violet-500/15 text-violet-400">Админ</Badge>
                    )}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {u.email} · {formatDate(u.createdAt)} · {u._count.products} товаров · {u._count.soldOrders} продаж
                  </p>
                </div>
                <span className="text-sm font-semibold">{formatPrice(u.balance)}</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCardTarget(u)}
                    disabled={busy === u.id}
                  >
                    <UserRound className="h-3.5 w-3.5" /> О нём
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBalanceTarget(u)}
                    disabled={busy === u.id}
                  >
                    <Coins className="h-3.5 w-3.5" /> Баланс
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => patch(u, { isVerified: !u.isVerified })}
                    disabled={busy === u.id}
                  >
                    <UserCheck className="h-3.5 w-3.5" /> {u.isVerified ? "Снять верификацию" : "Верифицировать"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => patch(u, { role: u.role === "ROLE_ADMIN" ? "ROLE_USER" : "ROLE_ADMIN" })}
                    disabled={busy === u.id}
                  >
                    {u.role === "ROLE_ADMIN" ? <ShieldOff className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                    {u.role === "ROLE_ADMIN" ? "Снять админа" : "Сделать админом"}
                  </Button>
                  <Button
                    variant={u.isBlocked ? "secondary" : "destructive"}
                    size="sm"
                    onClick={() => patch(u, { isBlocked: !u.isBlocked })}
                    disabled={busy === u.id}
                  >
                    <Ban className="h-3.5 w-3.5" /> {u.isBlocked ? "Разблокировать" : "Заблокировать"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!balanceTarget} onOpenChange={(o) => !o && setBalanceTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Изменить баланс — {balanceTarget?.name}</DialogTitle>
            <DialogDescription>
              Текущий баланс: {formatPrice(balanceTarget?.balance ?? 0)}. Положительное число — начислить, отрицательное — списать.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={adjustBalance} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bal-amount">Сумма (₽)</Label>
              <Input
                id="bal-amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Например: 500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bal-reason">Причина (необязательно)</Label>
              <Input
                id="bal-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Компенсация, бонус…"
              />
            </div>
            <Button type="submit" className="w-full" disabled={balanceLoading}>
              {balanceLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Применить
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <UserCardDialog userId={cardTarget?.id ?? null} open={!!cardTarget} onOpenChange={(o) => !o && setCardTarget(null)} />
    </div>
  );
}
