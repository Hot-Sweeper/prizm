import { BillingPageClient } from "./billing-page-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Billing — PRIZM",
};

export default function BillingPage() {
  return <BillingPageClient />;
}
