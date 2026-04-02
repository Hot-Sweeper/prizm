import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";

function getAdapter() {
  if (!process.env.DATABASE_URL) return undefined;
  // Dynamically require to avoid crashing when DATABASE_URL is missing
  const { DrizzleAdapter } = require("@auth/drizzle-adapter");
  const { db } = require("@/lib/db");
  const { accounts, sessions, users, verificationTokens } = require("@/lib/db/schema");
  return DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  });
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  adapter: getAdapter(),
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
    async createUser({ user }) {
      if (!user.id || !process.env.DATABASE_URL) return;

      try {
        const { db } = await import("@/lib/db");
        const { subscriptions } = await import("@/lib/db/schema");
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
        console.error("[auth] Failed to bootstrap subscription for user", user.id, err);
      }
    },
  },
  pages: {
    signIn: "/login",
  },
});
