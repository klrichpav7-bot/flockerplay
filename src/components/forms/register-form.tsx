"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Lock, Mail, User } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { registerSchema } from "@/lib/validations";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordStrength } from "@/components/auth/password-strength";

type FormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(registerSchema) });

  const password = watch("password") ?? "";
  const showStrength = useMemo(() => password.length > 0, [password]);

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      await api("/api/register", { method: "POST", body: JSON.stringify(values) });
      const res = await signIn("credentials", { ...values, redirect: false });
      if (res?.error) {
        toast.error("Аккаунт создан, но не удалось войти автоматически");
        router.push("/login");
        return;
      }
      toast.success("Аккаунт создан! Добро пожаловать на FlockerPlay");
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">Имя</Label>
        <div className="relative">
          <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="name" placeholder="Ваш ник или имя" className="pl-10" {...register("name")} />
        </div>
        {errors.name && <p className="text-xs text-rose-400">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="email" type="email" placeholder="you@example.com" className="pl-10" {...register("email")} />
        </div>
        {errors.email && <p className="text-xs text-rose-400">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Пароль</Label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            type="password"
            placeholder="Минимум 6 символов"
            className="pl-10"
            {...register("password")}
          />
        </div>
        {errors.password && <p className="text-xs text-rose-400">{errors.password.message}</p>}
        {showStrength && <PasswordStrength password={password} />}
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Создать аккаунт
      </Button>
    </form>
  );
}
