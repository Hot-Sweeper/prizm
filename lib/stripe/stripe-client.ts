import "server-only";
import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;

// Lazy singleton — only instantiated when first used so missing keys
// don't crash module evaluation during local dev without Stripe configured.
let _stripe: Stripe | null = null;
export function getStripe(): Stripe {
  if (!_stripe) {
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    _stripe = new Stripe(key, { apiVersion: "2026-03-25.dahlia", typescript: true });
  }
  return _stripe;
}

// Keep a named export for backwards compat — callers that import `stripe`
// directly will get the instance (throws if key missing, which is correct).
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
