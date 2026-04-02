import "server-only";
import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;

// Provide a dummy key in dev so the module loads without crashing.
// Real keys must be set before using any Stripe features.
export const stripe = new Stripe(key ?? "sk_test_dummy_placeholder", {
  apiVersion: "2026-03-25.dahlia",
  typescript: true,
});
