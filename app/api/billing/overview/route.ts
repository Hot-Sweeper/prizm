import { auth } from "@/auth";
import { getBalances } from "@/lib/credits";
import { isWhitelistedEmail } from "@/lib/credits/whitelist";
import { getSubscriptionByUserId } from "@/lib/stripe/subscription";
import { NextResponse } from "next/server";

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    }),
  ]);
}

export async function GET() {
  let session;
  try {
    session = await withTimeout(auth(), 5000, "auth");
  } catch (error) {
    console.error("[PRIZM][API] /api/billing/overview auth failed", error);
    return NextResponse.json({ error: "Auth timeout" }, { status: 503 });
  }

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [subscription, balances] = await Promise.all([
    withTimeout(getSubscriptionByUserId(session.user.id), 5000, "getSubscriptionByUserId").catch(() => null),
    withTimeout(getBalances(session.user.id), 5000, "getBalances").catch(() => ({ image: 0, video: 0 })),
  ]);

  const whitelisted = isWhitelistedEmail(session.user.email);

  return NextResponse.json({
    currentTier: whitelisted ? "max" : subscription?.tier ?? "free",
    isWhitelisted: whitelisted,
    status: subscription?.status ?? "active",
    balances,
  });
}
