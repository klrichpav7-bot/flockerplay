import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const providers: Provider[] = [
  Credentials({
    name: "credentials",
    credentials: { email: {}, password: {} },
    async authorize(credentials) {
      const email = (credentials?.email as string)?.toLowerCase().trim();
      const password = credentials?.password as string;
      if (!email || !password) return null;

      const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
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
        heldBalance: user.heldBalance,
        avatarUrl: user.avatarUrl,
        needsSetup: user.needsSetup,
      };
    },
  }),
];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  providers,
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (account?.provider === "google" && profile?.email) {
        const email = String(profile.email).toLowerCase();
        let dbUser = await prisma.user.findUnique({ where: { email } });
        if (!dbUser) {
          const random = crypto.randomBytes(32).toString("hex");
          dbUser = await prisma.user.create({
            data: {
              name: String(profile.name ?? "").trim() || email.split("@")[0],
              email,
              passwordHash: await bcrypt.hash(random, 10),
              googleId: account.providerAccountId,
              avatarUrl: typeof profile.picture === "string" ? profile.picture : null,
              needsSetup: true,
            },
          });
          await prisma.notification.create({
            data: {
              userId: dbUser.id,
              title: "Добро пожаловать на FlockerPlay!",
              body: "Завершите настройку профиля: укажите никнейм и фото.",
              type: "info",
            },
          });
        }
        token.id = dbUser.id;
        token.role = dbUser.role;
        token.isVerified = dbUser.isVerified;
        token.isSeller = dbUser.isSeller;
        token.balance = dbUser.balance;
        token.heldBalance = dbUser.heldBalance;
        token.avatarUrl = dbUser.avatarUrl;
        token.name = dbUser.name;
        token.email = dbUser.email;
        token.needsSetup = dbUser.needsSetup;
      }

      if (user && account?.provider !== "google") {
        token.id = user.id;
        token.role = user.role;
        token.isVerified = user.isVerified;
        token.isSeller = user.isSeller;
        token.balance = user.balance;
        token.heldBalance = user.heldBalance;
        token.avatarUrl = user.avatarUrl;
        token.needsSetup = Boolean(user.needsSetup);
      }
      if (token.id) {
        const fresh = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            balance: true,
            heldBalance: true,
            isVerified: true,
            isSeller: true,
            role: true,
            isBlocked: true,
            avatarUrl: true,
            name: true,
            needsSetup: true,
          },
        });
        if (!fresh || fresh.isBlocked) {
          return { ...token, id: undefined };
        }
        token.balance = fresh.balance;
        token.heldBalance = fresh.heldBalance;
        token.isVerified = fresh.isVerified;
        token.isSeller = fresh.isSeller;
        token.role = fresh.role;
        token.avatarUrl = fresh.avatarUrl;
        token.name = fresh.name;
        token.needsSetup = fresh.needsSetup;
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
        session.user.heldBalance = (token.heldBalance as number) ?? 0;
        session.user.avatarUrl = (token.avatarUrl as string) ?? null;
        session.user.needsSetup = Boolean(token.needsSetup);
      }
      return session;
    },
  },
});
