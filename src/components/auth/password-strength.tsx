"use client";

import { cn } from "@/lib/utils";

const LEVELS = [
  { label: "Слабый", bar: "bg-rose-500", text: "text-rose-400", shadow: "shadow-rose-500/40" },
  { label: "Средний", bar: "bg-amber-500", text: "text-amber-400", shadow: "shadow-amber-500/40" },
  { label: "Хороший", bar: "bg-lime-500", text: "text-lime-400", shadow: "shadow-lime-500/40" },
  { label: "Надёжный", bar: "bg-emerald-500", text: "text-emerald-400", shadow: "shadow-emerald-500/40" },
];

export function passwordStrengthScore(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  return Math.min(score, 4);
}

export function PasswordStrength({ password }: { password: string }) {
  const score = passwordStrengthScore(password);
  const level = score > 0 ? LEVELS[score - 1] : null;

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-all duration-300",
              password ? (i <= score ? level?.bar : "bg-muted") : "bg-muted"
            )}
          />
        ))}
      </div>
      {password && level && (
        <p className={cn("text-xs font-medium", level.text)}>
          {level.label}
          <span className="ml-1.5 font-normal text-muted-foreground">
            {score === 1 && "— минимум: добавьте цифры, заглавные буквы или символы"}
            {score === 2 && "— неплохо, но можно надёжнее"}
            {score === 3 && "— хороший пароль"}
            {score === 4 && "— отличный пароль"}
          </span>
        </p>
      )}
    </div>
  );
}
