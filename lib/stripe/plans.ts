export const PLANS = {
  free: {
    tier: "free" as const,
    stripePriceId: null,
    imageCredits: 10,
    videoCredits: 0,
    queuePriority: 10,
    displayName: "Free",
    monthlyPriceUSD: 0,
  },
  pro: {
    tier: "pro" as const,
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID!,
    imageCredits: 100,
    videoCredits: 10,
    queuePriority: 5,
    displayName: "Pro",
    monthlyPriceUSD: 19,
  },
  max: {
    tier: "max" as const,
    stripePriceId: process.env.STRIPE_MAX_PRICE_ID!,
    imageCredits: 500,
    videoCredits: 50,
    queuePriority: 1,
    displayName: "Max",
    monthlyPriceUSD: 49,
  },
} as const;

export type PlanTier = keyof typeof PLANS;

export function getPlanByPriceId(priceId: string): (typeof PLANS)[PlanTier] | null {
  for (const plan of Object.values(PLANS)) {
    if (plan.stripePriceId === priceId) return plan;
  }
  return null;
}
