import "server-only";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getPlanByPriceId } from "./plans";
import { getSubscriptionByStripeCustomerId } from "./subscription";
import { grantMonthlyCredits } from "@/lib/credits/grant";
import { forfeitAllCredits } from "@/lib/credits/forfeit";
import { creditLedger } from "@/lib/db/schema";

export async function handleSubscriptionCreated(
  event: Stripe.CustomerSubscriptionCreatedEvent
) {
  const sub = event.data.object;
  const priceId = sub.items.data[0]?.price.id;
  if (!priceId) return;

  const plan = getPlanByPriceId(priceId);
  if (!plan || plan.tier === "free") return;

  const existingSub = await getSubscriptionByStripeCustomerId(
    sub.customer as string
  );
  if (!existingSub) return;

  // Idempotency: skip if we already processed this event
  if (existingSub.lastStripeEventId === event.id) return;

  await db
    .update(subscriptions)
    .set({
      tier: plan.tier,
      status: "active",
      stripeSubscriptionId: sub.id,
      // Period fields moved in Stripe API 2026 — accessed via items if needed
      currentPeriodStart: null,
      currentPeriodEnd: null,
      lastStripeEventId: event.id,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeCustomerId, sub.customer as string));
}

export async function handleSubscriptionUpdated(
  event: Stripe.CustomerSubscriptionUpdatedEvent
) {
  const sub = event.data.object;
  const priceId = sub.items.data[0]?.price.id;
  if (!priceId) return;

  const plan = getPlanByPriceId(priceId);
  const existingSub = await getSubscriptionByStripeCustomerId(
    sub.customer as string
  );
  if (!existingSub || existingSub.lastStripeEventId === event.id) return;

  await db
    .update(subscriptions)
    .set({
      tier: plan?.tier ?? "free",
      status: sub.status as "active" | "canceled" | "past_due" | "trialing" | "incomplete",
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      lastStripeEventId: event.id,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeCustomerId, sub.customer as string));
}

export async function handleSubscriptionDeleted(
  event: Stripe.CustomerSubscriptionDeletedEvent
) {
  const sub = event.data.object;
  const existingSub = await getSubscriptionByStripeCustomerId(
    sub.customer as string
  );
  if (!existingSub) return;

  await db
    .update(subscriptions)
    .set({
      tier: "free",
      status: "canceled",
      stripeSubscriptionId: null,
      cancelAtPeriodEnd: false,
      lastStripeEventId: event.id,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeCustomerId, sub.customer as string));

  // Forfeit all remaining credits on cancellation (as per business rules)
  await forfeitAllCredits(existingSub.userId);
}

export async function handleInvoicePaymentSucceeded(
  event: Stripe.InvoicePaymentSucceededEvent
) {
  const invoice = event.data.object;
  // invoice.subscription field changed in Stripe API 2026 — access via unknown cast
  const invoiceSubId = (invoice as unknown as Record<string, unknown>).subscription as string | null | undefined;
  if (!invoiceSubId) return;

  const customerId = invoice.customer as string;
  const existingSub = await getSubscriptionByStripeCustomerId(customerId);
  if (!existingSub) return;

  // Idempotency: skip if this invoice event was already processed
  const alreadyProcessed = await db.query.creditLedger.findFirst({
    where: eq(creditLedger.stripeEventId, `${event.id}_image`),
  });
  if (alreadyProcessed) return;

  await grantMonthlyCredits(existingSub.userId, existingSub.tier, event.id);
}

export async function handleInvoicePaymentFailed(
  event: Stripe.InvoicePaymentFailedEvent
) {
  const invoice = event.data.object;
  const customerId = invoice.customer as string;

  await db
    .update(subscriptions)
    .set({
      status: "past_due",
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeCustomerId, customerId));
}
