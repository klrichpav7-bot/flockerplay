import {
  CreditCard,
  Coins,
  Gift,
  KeyRound,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

const map: Record<string, LucideIcon> = {
  key: KeyRound,
  coins: Coins,
  zap: Zap,
  gift: Gift,
  "credit-card": CreditCard,
  wrench: Wrench,
};

export function CategoryIcon({ icon, className }: { icon?: string | null; className?: string }) {
  const Icon = (icon && map[icon]) || Coins;
  return <Icon className={className} />;
}
