import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const sizes = {
  xs: "h-3.5 w-3.5",
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
} as const;

export function VerifiedBadge({
  className,
  size = "sm",
  title = "Верифицированный пользователь",
}: {
  className?: string;
  size?: keyof typeof sizes;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-sky-500 text-white shadow-sm shadow-sky-500/40 ring-2 ring-sky-500/20",
        sizes[size],
        className
      )}
    >
      <BadgeCheck className="h-full w-full" strokeWidth={3} />
    </span>
  );
}
