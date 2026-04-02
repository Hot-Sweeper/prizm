import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { db } from "@/lib/db";
import { accounts, sessions, users, verificationTokens } from "@/lib/db/schema";
import { subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: "jwt" },
  providers: [
    // Dummy credentials — accepts any email + any password for local dev
    Credentials({
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },
      authorize(credentials) {
        if (!credentials?.email) return null;
        return {
          id:    "dev-user-001",
          name:  "Dev User",
          email: String(credentials.email),
        };
      },
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (token?.sub) session.user.id = token.sub;
      return session;
    },
  },
  events: {
    // Create Stripe customer + default free subscription row on first sign-up
    async createUser({ user }) {
      if (!user.id) return;

      try {
        // Dynamically import to avoid circular deps at module load time
        const { createStripeCustomer } = await import(
          "@/lib/stripe/subscription"
        );
        const stripeCustomerId = await createStripeCustomer(
          user.id,
          user.email ?? undefined,
          user.name ?? undefined
        );

        await db.insert(subscriptions).values({
          userId: user.id,
          tier: "free",
          status: "active",
          stripeCustomerId,
        });
      } catch (err) {
        // Non-fatal — user can still log in; subscription row created lazily
        console.error("[auth] Failed to bootstrap subscription for user", user.id, err);
      }
    },
  },
  pages: {
    signIn: "/login",
  },
});
