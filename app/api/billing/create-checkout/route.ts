import "server-only";
import { auth } from "@/auth";
import { stripe } from "@/lib/stripe/stripe-client";
import { getSubscriptionByUserId } from "@/lib/stripe/subscription";
import { PLANS } from "@/lib/stripe/plans";
import { NextResponse } from "next/server";
import { z } from "zod";

const checkoutSchema = z.object({
  tier: z.enum(["pro", "max"]),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  const { tier } = parsed.data;
  const plan = PLANS[tier];

  const sub = await getSubscriptionByUserId(session.user.id);
  if (!sub?.stripeCustomerId) {
    return NextResponse.json({ error: "No Stripe customer found" }, { status: 400 });
  }

  const origin = request.headers.get("origin") ?? process.env.AUTH_URL!;

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: sub.stripeCustomerId,
    line_items: [{ price: plan.stripePriceId, quantity: 1 }],
    success_url: `${origin}/dashboard?upgraded=1`,
    cancel_url: `${origin}/billing`,
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
