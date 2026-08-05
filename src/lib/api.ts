import { NextResponse } from "next/server";
import type { Session } from "next-auth";

export function json(data: unknown, init?: number | ResponseInit) {
  if (typeof init === "number") return NextResponse.json(data, { status: init });
  return NextResponse.json(data, init);
}

export function error(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function isAdmin(session: Session | null): boolean {
  return !!session && session.user.role === "ROLE_ADMIN";
}
