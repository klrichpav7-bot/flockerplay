"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2, Lock, Mail, TriangleAlert, User } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function GoogleRegister() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const [loading, setLoading] = useState(false);

  async function onGoogle() {
    setLoading(true);
    try {
      await signIn("google", { callbackUrl });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass-strong w-full max-w-md rounded-3xl p-8">
      <div className="mb-7 flex flex-col items-center gap-3 text-center">
        <Logo />
        <div>
          <h1 className="font-display text-2xl font-bold">Создать аккаунт</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Регистрация на FlockerPlay — через Google
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onGoogle}
        disabled={loading}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold transition hover:border-primary/40 hover:bg-muted/40 disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : <GoogleIcon />}
        Продолжить с Google
      </button>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">или</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-border">
        <div className="space-y-5 p-6 opacity-40 blur-[1px] [pointer-events:none] select-none">
          <div className="space-y-2">
            <Label htmlFor="g-name">Имя</Label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="g-name" placeholder="Ваш ник или имя" className="pl-10" disabled />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="g-email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="g-email" type="email" placeholder="you@example.com" className="pl-10" disabled />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="g-password">Пароль</Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="g-password" type="password" placeholder="Минимум 6 символов" className="pl-10" disabled />
            </div>
          </div>
        </div>

        <div className="absolute inset-0 z-10 flex items-center justify-center p-6">
          <div className="rounded-2xl border border-amber-500/25 bg-background/80 px-5 py-4 text-center shadow-xl backdrop-blur-md">
            <TriangleAlert className="mx-auto h-5 w-5 text-amber-400" />
            <p className="mt-2 text-sm font-semibold">Регистрация через email и пароль временно недоступна</p>
            <p className="mt-1 text-xs text-muted-foreground">Войдите через Google — это займёт несколько секунд</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
      <path fill="none" d="M0 0h48v48H0z" />
    </svg>
  );
}
