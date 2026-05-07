import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getBalances } from "@/lib/credits";
import { isWhitelistedEmail } from "@/lib/credits/whitelist";
import { getSubscriptionByUserId } from "@/lib/stripe/subscription";
import { getUserJobs } from "@/lib/db/queries/jobs";
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

  // Race DB calls against a timeout so a hung DB connection never blocks SSR.
  const withTimeout = <T>(p: Promise<T>, fallback: T, ms = 5000): Promise<T> =>
    Promise.race([p, new Promise<T>((res) => setTimeout(() => res(fallback), ms))]);

  const [balances, subscription, recentJobs] = await Promise.all([
    whitelisted
      ? INFINITE_BALANCE
      : withTimeout(getBalances(session.user.id).catch(() => ({ image: 0, video: 0 })), { image: 0, video: 0 }),
    withTimeout(getSubscriptionByUserId(session.user.id).catch(() => null), null),
    withTimeout(getUserJobs(session.user.id, 1).catch(() => []), []),
  ]);

  const tier = whitelisted ? "max" : (subscription?.tier ?? "free");

  return (
    <main id="maincontent" tabIndex={-1} style={{ height: "100%", overflow: "hidden", display: "flex" }}>
      <GenerateClient
        userTier={tier}
        imageBalance={balances.image}
        videoBalance={balances.video}
        isWhitelisted={whitelisted}
        initialHistory={recentJobs}
      />
    </main>
  );
}

