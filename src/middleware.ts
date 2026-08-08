import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    secureCookie: req.cookies.has("__Secure-authjs.session-token"),
  });

  const isAdminRoute = pathname.startsWith("/admin");
  const isProtected =
    pathname.startsWith("/dashboard") || pathname.startsWith("/support") || pathname.startsWith("/checkout");

  if (isAdminRoute && (!token || token.role !== "ROLE_ADMIN")) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (isProtected && !token) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/support/:path*", "/checkout/:path*"],
};
