"use client";

import { useEffect, useState } from "react";
import { Ban, Loader2, Mail, ShieldCheck, Store, UserRound } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { VerifiedBadge } from "@/components/shared/verified-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDate, formatPrice, initials } from "@/lib/format";

interface UserCardUser {
  id: string;
  name: string;
  email: string;
  role: "ROLE_USER" | "ROLE_ADMIN";
  avatarUrl: string | null;
  about: string | null;
  isSeller: boolean;
  isVerified: boolean;
  isBlocked: boolean;
  balance: number;
  heldBalance: number;
  createdAt: string;
  updatedAt: string;
  _count: {
    products: number;
    orders: number;
    soldOrders: number;
    tickets: number;
    reviewsMade: number;
    reviewsReceived: number;
    complaintsMade: number;
    complaintsOnMe: number;
  };
}

export function UserCardDialog({
  userId,
  open,
  onOpenChange,
}: {
  userId: string | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [user, setUser] = useState<UserCardUser | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !userId) {
      setUser(null);
      return;
    }
    let active = true;
    setLoading(true);
    api<{ user: UserCardUser }>(`/api/admin/users/${userId}`)
      .then((d) => {
        if (active) setUser(d.user);
      })
      .catch((e) => {
        toast.error(e instanceof Error ? e.message : "Ошибка загрузки");
        onOpenChange(false);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open, userId, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-8">
            <UserRound className="h-5 w-5 text-violet-400" /> О нём
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <Loader2 className="mx-auto my-10 h-6 w-6 animate-spin text-muted-foreground" />
        ) : user ? (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 ring-2 ring-border/60">
                <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name} />
                <AvatarFallback className="text-lg">{initials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 font-semibold">
                  <span className="truncate">{user.name}</span>
                  {user.isVerified && <VerifiedBadge size="sm" />}
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" /> {user.email}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {user.role === "ROLE_ADMIN" && (
                    <Badge className="bg-violet-500/15 text-violet-400">
                      <ShieldCheck className="h-3 w-3" /> Админ
                    </Badge>
                  )}
                  {user.isSeller && (
                    <Badge className="bg-emerald-500/15 text-emerald-400">
                      <Store className="h-3 w-3" /> Продавец
                    </Badge>
                  )}
                  {user.isBlocked && (
                    <Badge className="bg-rose-500/15 text-rose-400">
                      <Ban className="h-3 w-3" /> Заблокирован
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {user.about && (
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">О себе</p>
                <p className="whitespace-pre-wrap rounded-2xl bg-muted/40 p-3 text-sm">{user.about}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-2xl border border-border/60 p-3">
                <p className="text-xs text-muted-foreground">Баланс</p>
                <p className="mt-0.5 text-sm font-bold">{formatPrice(user.balance)}</p>
              </div>
              <div className="rounded-2xl border border-border/60 p-3">
                <p className="text-xs text-muted-foreground">Заморожено</p>
                <p className="mt-0.5 text-sm font-bold">{formatPrice(user.heldBalance)}</p>
              </div>
              <div className="rounded-2xl border border-border/60 p-3">
                <p className="text-xs text-muted-foreground">Товаров</p>
                <p className="mt-0.5 text-sm font-bold">{user._count.products}</p>
              </div>
              <div className="rounded-2xl border border-border/60 p-3">
                <p className="text-xs text-muted-foreground">Покупок / продаж</p>
                <p className="mt-0.5 text-sm font-bold">
                  {user._count.orders} / {user._count.soldOrders}
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 p-3">
                <p className="text-xs text-muted-foreground">Отзывов получено</p>
                <p className="mt-0.5 text-sm font-bold">{user._count.reviewsReceived}</p>
              </div>
              <div className="rounded-2xl border border-border/60 p-3">
                <p className="text-xs text-muted-foreground">Тикеты / жалобы</p>
                <p className="mt-0.5 text-sm font-bold">
                  {user._count.tickets} / {user._count.complaintsOnMe}
                </p>
              </div>
            </div>

            <div className="space-y-1.5 rounded-2xl bg-muted/40 p-3 text-xs text-muted-foreground">
              <p className="flex justify-between gap-2">
                <span>Регистрация</span>
                <span>{formatDate(user.createdAt)}</span>
              </p>
              <p className="flex justify-between gap-2">
                <span>ID</span>
                <span className="font-mono">{user.id}</span>
              </p>
            </div>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">Пользователь не найден</p>
        )}

        {user && (
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Закрыть
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
