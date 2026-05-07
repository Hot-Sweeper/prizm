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

function withTimeout<T>(p: Promise<T>, fallback: T, label: string, ms = 5000): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((res) =>
      setTimeout(() => {
        console.error(`[PRIZM][SSR] TIMEOUT after ${ms}ms: ${label}`);
        res(fallback);
      }, ms)
    ),
  ]);
}

export default async function GeneratePage() {
  console.log("[PRIZM][SSR] GeneratePage: start");

  let session;
  try {
    session = await withTimeout(auth(), null, "auth()", 5000);
  } catch (err) {
    console.error("[PRIZM][SSR] auth() threw:", err);
    session = null;
  }
  console.log("[PRIZM][SSR] auth() done, user:", session?.user?.id ?? "none");

  if (!session?.user?.id) {
    console.log("[PRIZM][SSR] no session — redirecting to /login");
    redirect("/login");
  }

  const whitelisted = isWhitelistedEmail(session.user.email);
  console.log("[PRIZM][SSR] whitelisted:", whitelisted);

  const [balances, subscription, recentJobs] = await Promise.all([
    whitelisted
      ? INFINITE_BALANCE
      : withTimeout(getBalances(session.user.id).catch((e) => { console.error("[PRIZM][SSR] getBalances threw:", e); return { image: 0, video: 0 }; }), { image: 0, video: 0 }, "getBalances"),
    withTimeout(getSubscriptionByUserId(session.user.id).catch((e) => { console.error("[PRIZM][SSR] getSubscription threw:", e); return null; }), null, "getSubscription"),
    withTimeout(getUserJobs(session.user.id, 1).catch((e) => { console.error("[PRIZM][SSR] getUserJobs threw:", e); return []; }), [], "getUserJobs"),
  ]);
  console.log("[PRIZM][SSR] DB queries done", { balances, hasSubscription: !!subscription, jobCount: recentJobs.length });

  const tier = whitelisted ? "max" : (subscription?.tier ?? "free");

  return (
    <main id="maincontent" tabIndex={-1} style={{ height: "100%", overflow: "hidden", display: "flex" }}>
      {/* PRIZM-BUILD: {new Date().toISOString()} */}
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

