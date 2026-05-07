import { auth } from "@/auth";
import { getBalances } from "@/lib/credits";
import { isWhitelistedForRequest } from "@/lib/credits/whitelist";
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

export async function GET(request: Request) {
  const isLocalDev = isWhitelistedForRequest(undefined, request.url);
  let session;
  try {
    session = await withTimeout(auth(), 5000, "auth");
  } catch (error) {
    console.error("[PRIZM][API] /api/billing/overview auth failed", error);
    if (isLocalDev) {
      return NextResponse.json({
        currentTier: "max",
        isWhitelisted: true,
        status: "active",
        balances: { image: 999_999, video: 999_999 },
      });
    }
    return NextResponse.json({ error: "Auth timeout" }, { status: 503 });
  }

  if (!session?.user?.id) {
    if (isLocalDev) {
      return NextResponse.json({
        currentTier: "max",
        isWhitelisted: true,
        status: "active",
        balances: { image: 999_999, video: 999_999 },
      });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [subscription, balances] = await Promise.all([
    withTimeout(getSubscriptionByUserId(session.user.id), 5000, "getSubscriptionByUserId").catch(() => null),
    withTimeout(getBalances(session.user.id), 5000, "getBalances").catch(() => ({ image: 0, video: 0 })),
  ]);

  const whitelisted = isWhitelistedForRequest(session.user.email, request.url);

  return NextResponse.json({
    currentTier: whitelisted ? "max" : subscription?.tier ?? "free",
    isWhitelisted: whitelisted,
    status: subscription?.status ?? "active",
    balances,
  });
}
