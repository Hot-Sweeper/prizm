import "server-only";
import { auth } from "@/auth";
import { stripe } from "@/lib/stripe/stripe-client";
import { getSubscriptionByUserId } from "@/lib/stripe/subscription";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sub = await getSubscriptionByUserId(session.user.id);
  if (!sub?.stripeCustomerId) {
    return NextResponse.json({ error: "No Stripe customer found" }, { status: 400 });
  }

  const origin = request.headers.get("origin") ?? process.env.AUTH_URL!;

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${origin}/billing`,
  });

  return NextResponse.json({ url: portalSession.url });
}
