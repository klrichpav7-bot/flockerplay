import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const email = (credentials?.email as string)?.toLowerCase().trim();
        const password = credentials?.password as string;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;
        if (user.isBlocked) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          isSeller: user.isSeller,
          balance: user.balance,
          avatarUrl: user.avatarUrl,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.isVerified = user.isVerified;
        token.isSeller = user.isSeller;
        token.balance = user.balance;
        token.avatarUrl = user.avatarUrl;
      }
      if (token.id) {
        const fresh = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            balance: true,
            isVerified: true,
            isSeller: true,
            role: true,
            isBlocked: true,
            avatarUrl: true,
            name: true,
          },
        });
        if (!fresh || fresh.isBlocked) {
          return { ...token, id: undefined };
        }
        token.balance = fresh.balance;
        token.isVerified = fresh.isVerified;
        token.isSeller = fresh.isSeller;
        token.role = fresh.role;
        token.avatarUrl = fresh.avatarUrl;
        token.name = fresh.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token?.id) {
        session.user.id = token.id as string;
        session.user.role = token.role as "ROLE_USER" | "ROLE_ADMIN";
        session.user.isVerified = Boolean(token.isVerified);
        session.user.isSeller = Boolean(token.isSeller);
        session.user.balance = (token.balance as number) ?? 0;
        session.user.avatarUrl = (token.avatarUrl as string) ?? null;
      }
      return session;
    },
  },
});
