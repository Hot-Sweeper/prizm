import "server-only";
import { db } from "@/lib/db";
import { creditLedger } from "@/lib/db/schema";
import { PLANS } from "@/lib/stripe/plans";
import type { PlanTier } from "@/lib/stripe/plans";

interface GrantCreditsParams {
  userId: string;
  creditType: "image" | "video";
  amount: number;
  reason: "subscription_grant" | "admin_adjustment";
  stripeEventId?: string;
}

export async function grantCredits(params: GrantCreditsParams): Promise<void> {
  await db.insert(creditLedger).values({
    userId: params.userId,
    creditType: params.creditType,
    delta: params.amount,
    reason: params.reason,
    stripeEventId: params.stripeEventId ?? null,
  });
}

/** Grants the monthly image + video credits for a given subscription tier. */
export async function grantMonthlyCredits(
  userId: string,
  tier: PlanTier,
  stripeEventId: string
): Promise<void> {
  const plan = PLANS[tier];

  await Promise.all([
    grantCredits({
      userId,
      creditType: "image",
      amount: plan.imageCredits,
      reason: "subscription_grant",
      stripeEventId: `${stripeEventId}_image`,
    }),
    ...(plan.videoCredits > 0
      ? [
          grantCredits({
            userId,
            creditType: "video",
            amount: plan.videoCredits,
            reason: "subscription_grant",
            stripeEventId: `${stripeEventId}_video`,
          }),
        ]
      : []),
  ]);
}
