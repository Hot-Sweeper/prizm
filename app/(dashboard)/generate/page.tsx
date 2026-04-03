import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getBalances } from "@/lib/credits";
import { isWhitelistedEmail } from "@/lib/credits/whitelist";
import { getSubscriptionByUserId } from "@/lib/stripe/subscription";
import { GenerateClient } from "./generate-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Generate — PRIZM",
  description: "Create viral AI images and videos",
};

const INFINITE_BALANCE = { image: 999_999, video: 999_999 };

export default async function GeneratePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const whitelisted = isWhitelistedEmail(session.user.email);

  const [balances, subscription] = await Promise.all([
    whitelisted
      ? INFINITE_BALANCE
      : getBalances(session.user.id).catch(() => ({ image: 0, video: 0 })),
    getSubscriptionByUserId(session.user.id).catch(() => null),
  ]);

  const tier = whitelisted ? "max" : (subscription?.tier ?? "free");

  return (
    <main id="maincontent" tabIndex={-1}>
      <GenerateClient
        userTier={tier}
        imageBalance={balances.image}
        videoBalance={balances.video}
        isWhitelisted={whitelisted}
      />
    </main>
  );
}

