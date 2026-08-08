"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export function SessionGate() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && session?.user?.needsSetup && pathname !== "/setup-profile") {
      router.replace("/setup-profile");
    }
  }, [status, session?.user?.needsSetup, pathname, router]);

  return null;
}
