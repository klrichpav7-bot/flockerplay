import "next-auth";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ROLE_USER" | "ROLE_ADMIN";
      isVerified: boolean;
      isSeller: boolean;
      balance: number;
      heldBalance: number;
      avatarUrl?: string | null;
      needsSetup: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: string;
    isVerified: boolean;
    isSeller: boolean;
    balance: number;
    heldBalance: number;
    avatarUrl?: string | null;
    needsSetup: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    isVerified?: boolean;
    isSeller?: boolean;
    balance?: number;
    heldBalance?: number;
    avatarUrl?: string | null;
    needsSetup?: boolean;
  }
}
