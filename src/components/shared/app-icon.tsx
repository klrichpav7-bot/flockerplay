import {
  Coins,
  CreditCard,
  Gamepad2,
  Gift,
  KeyRound,
  Wrench,
  Zap,
  Star,
  Crown,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";

const lucideMap: Record<string, LucideIcon> = {
  key: KeyRound,
  coins: Coins,
  zap: Zap,
  gift: Gift,
  "credit-card": CreditCard,
  wrench: Wrench,
  star: Star,
  crown: Crown,
  chat: MessageCircle,
  gamepad: Gamepad2,
};

const EMOJI_RE = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{2E50}-\u{2E7F}]/u;

export function AppIcon({
  icon,
  className,
  textClassName,
}: {
  icon?: string | null;
  className?: string;
  textClassName?: string;
}) {
  if (!icon) {
    const Icon = Coins;
    return <Icon className={className} />;
  }
  if (icon.startsWith("http") || icon.startsWith("data:") || icon.startsWith("/uploads") || icon.startsWith("/images")) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={icon} alt="" className={className} draggable={false} />;
  }
  if (EMOJI_RE.test(icon) && icon.length <= 8) {
    return <span className={textClassName ?? className ?? ""}>{icon}</span>;
  }
  const Icon = lucideMap[icon] ?? Coins;
  return <Icon className={className} />;
}
