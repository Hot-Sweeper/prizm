import "server-only";
import { stripe } from "./stripe-client";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function createStripeCustomer(
  userId: string,
  email?: string,
  name?: string
): Promise<string> {
  const customer = await stripe.customers.create({
    email,
    name: name ?? undefined,
    metadata: { userId },
  });
  return customer.id;
}

export async function getSubscriptionByUserId(userId: string) {
  return db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
  });
}

export async function getSubscriptionByStripeCustomerId(
  stripeCustomerId: string
) {
  return db.query.subscriptions.findFirst({
    where: eq(subscriptions.stripeCustomerId, stripeCustomerId),
  });
}
