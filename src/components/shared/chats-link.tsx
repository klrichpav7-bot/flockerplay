"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessagesSquare } from "lucide-react";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export function ChatsLink({ className }: { className?: string }) {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const d = await api<{ chats: { unread: number }[] }>("/api/orders/chats");
        if (active) setUnread(d.chats.reduce((s, c) => s + c.unread, 0));
      } catch {
        /* not authed */
      }
    };
    load();
    const t = setInterval(load, 15000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, []);

  return (
    <Link
      href="/dashboard/chats"
      className={cn(
        "relative grid h-10 w-10 place-items-center rounded-full border border-border bg-card/60 text-foreground/80 transition hover:border-primary/40 hover:text-foreground",
        className
      )}
      aria-label="Чаты"
    >
      <MessagesSquare className="h-[18px] w-[18px]" />
      {unread > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-sky-500 px-1 text-[10px] font-bold text-white shadow-lg shadow-sky-500/40">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </Link>
  );
}
