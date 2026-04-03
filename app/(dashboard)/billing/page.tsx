import { auth } from "@/auth";
import { getSubscriptionByUserId } from "@/lib/stripe/subscription";
import { getBalances } from "@/lib/credits";
import { PLANS } from "@/lib/stripe/plans";
import { Check } from "@phosphor-icons/react/dist/ssr";
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Billing — PRIZM",
};

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const [subscription, balances] = await Promise.all([
    getSubscriptionByUserId(session.user.id).catch(() => null),
    getBalances(session.user.id).catch(() => ({ image: 0, video: 0 })),
  ]);

  const currentTier = subscription?.tier ?? "free";
  const status = subscription?.status ?? "active";

  const V   = "var(--color-primary)";
  const VL  = "var(--color-secondary)";
  const VLL = "var(--color-accent)";

  const card: CSSProperties = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "1.25rem",
    padding: "1.5rem",
  };

  return (
    <main id="maincontent" tabIndex={-1} style={{ maxWidth: "1024px", margin: "0 auto", padding: "2rem 1.5rem", width: "100%", overflowY: "auto", height: "100%", color: "#fff", fontFamily: "var(--font-sans)" }}>

      {/* Page heading */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 className="font-display" style={{ fontSize: "2.25rem", letterSpacing: "0.06em", marginBottom: "0.375rem" }}>
          BILLING &amp; CREDITS
        </h1>
        <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.38)" }}>
          Manage your subscription and available generation credits.
        </p>
      </div>

      {/* Current plan + credits row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "2.5rem" }}>

        {/* Current plan */}
        <div style={card}>
          <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: "0.625rem" }}>
            Current Plan
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1.25rem" }}>
            <span className="font-display" style={{ fontSize: "2.25rem", color: VLL, letterSpacing: "0.06em" }}>
              {currentTier.toUpperCase()}
            </span>
            {status !== "active" && (
              <span style={{ fontSize: "0.8rem", color: "#fbbf24", fontWeight: 600, textTransform: "capitalize" }}>
                ({status})
              </span>
            )}
          </div>
          <form action="/api/billing/create-portal" method="POST">
            <button
              type="submit"
              disabled={currentTier === "free"}
              className="plan-cta"
              style={{
                padding: "9px 20px",
                borderRadius: "999px",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.65)",
                fontSize: "0.8125rem", fontWeight: 600,
                cursor: currentTier === "free" ? "not-allowed" : "pointer",
                opacity: currentTier === "free" ? 0.4 : 1,
              }}
            >
              Manage Subscription
            </button>
          </form>
        </div>

        {/* Credit balances */}
        <div style={card}>
          <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: "0.875rem" }}>
            Available Credits
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            {[
              { label: "Images",        value: balances.image, icon: "Img" },
              { label: "Video credits", value: balances.video, icon: "Vid" },
            ].map(({ label, value, icon }) => (
              <div key={label} style={{
                background: "rgba(124,58,237,0.08)",
                border: "1px solid rgba(167,139,250,0.15)",
                borderRadius: "0.875rem",
                padding: "1rem",
              }}>
                <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.38)", marginBottom: "0.375rem" }}>{label}</p>
                <p className="font-display" style={{ fontSize: "2rem", color: "#fff", lineHeight: 1, letterSpacing: "0.04em" }}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Plans */}
      <h2 className="font-display" style={{ fontSize: "1.6rem", letterSpacing: "0.06em", marginBottom: "1.25rem", color: "rgba(255,255,255,0.7)" }}>
        PLANS
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
        {Object.entries(PLANS).map(([tier, plan]) => {
          const isCurrent = currentTier === tier;
          const isHighlight = tier === "pro";

          return (
            <div
              key={tier}
              style={{
                position: "relative",
                display: "flex", flexDirection: "column",
                borderRadius: "1.25rem",
                padding: "1.5rem",
                border: isCurrent
                  ? `1px solid rgba(167,139,250,0.5)`
                  : isHighlight
                    ? `1px solid rgba(124,58,237,0.35)`
                    : "1px solid rgba(255,255,255,0.07)",
                background: isCurrent
                  ? "rgba(124,58,237,0.12)"
                  : isHighlight
                    ? "rgba(124,58,237,0.06)"
                    : "rgba(255,255,255,0.025)",
                boxShadow: isCurrent ? `0 0 40px rgba(124,58,237,0.18)` : "none",
              }}
            >
              {isCurrent && (
                <div style={{
                  position: "absolute", top: "-1px", left: "50%", transform: "translateX(-50%)",
                  background: `linear-gradient(90deg, ${V}, ${VL})`,
                  color: "#fff", fontSize: "0.6rem", fontWeight: 800,
                  letterSpacing: "0.14em", textTransform: "uppercase",
                  padding: "3px 16px", borderRadius: "0 0 10px 10px",
                  whiteSpace: "nowrap",
                }}>
                  Current Plan
                </div>
              )}

              <div style={{ paddingTop: isCurrent ? "0.625rem" : 0, marginBottom: "1.25rem" }}>
                <p className="font-display" style={{ fontSize: "1.5rem", letterSpacing: "0.06em", color: isCurrent ? VLL : "#fff", marginBottom: "0.375rem" }}>
                  {plan.displayName.toUpperCase()}
                </p>
                <div style={{ display: "flex", alignItems: "baseline", gap: "3px" }}>
                  <span className="font-display" style={{ fontSize: "3rem", lineHeight: 1, color: "#fff" }}>
                    ${plan.monthlyPriceUSD}
                  </span>
                  <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.3)" }}>/mo</span>
                </div>
              </div>

              <ul style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.625rem", marginBottom: "1.5rem", listStyle: "none" }}>
                <li style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "0.875rem", color: "rgba(255,255,255,0.6)" }}>
                  <Check size={14} style={{ color: VL, flexShrink: 0, marginTop: "2px" }} aria-hidden />
                  <span><strong style={{ color: "#fff" }}>{plan.imageCredits}</strong> image credits / mo</span>
                </li>
                <li style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "0.875rem", color: "rgba(255,255,255,0.6)" }}>
                  <Check size={14} style={{ color: VL, flexShrink: 0, marginTop: "2px" }} aria-hidden />
                  <span><strong style={{ color: "#fff" }}>{plan.videoCredits}</strong> video credits / mo</span>
                </li>
                {tier !== "free" && (
                  <li style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "0.875rem", color: "rgba(255,255,255,0.6)" }}>
                    <Check size={14} style={{ color: VL, flexShrink: 0, marginTop: "2px" }} aria-hidden />
                    <span>All premium models</span>
                  </li>
                )}
                {tier === "max" && (
                  <li style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "0.875rem", color: "rgba(255,255,255,0.6)" }}>
                    <Check size={14} style={{ color: VL, flexShrink: 0, marginTop: "2px" }} aria-hidden />
                    <span>Priority queue bypass</span>
                  </li>
                )}
              </ul>

              <form action="/api/billing/create-checkout" method="POST">
                <input type="hidden" name="priceId" value={plan.stripePriceId ?? ""} />
                <button
                  type="submit"
                  disabled={isCurrent || tier === "free"}
                  className="plan-cta"
                  style={{
                    width: "100%",
                    padding: "12px 20px",
                    borderRadius: "999px",
                    border: "none",
                    fontSize: "0.9rem", fontWeight: 700,
                    cursor: (isCurrent || tier === "free") ? "not-allowed" : "pointer",
                    background: isCurrent
                      ? "rgba(255,255,255,0.06)"
                      : tier === "free"
                        ? "rgba(255,255,255,0.04)"
                        : V,
                    color: (isCurrent || tier === "free") ? "rgba(255,255,255,0.35)" : "var(--color-primary-text)",
                    boxShadow: (!isCurrent && tier !== "free") ? `0 0 24px ${V}55` : "none",
                    opacity: (isCurrent || tier === "free") ? 0.6 : 1,
                  }}
                >
                  {isCurrent ? "Current Plan" : tier === "free" ? "Free Forever" : `Upgrade to ${plan.displayName}`}
                </button>
              </form>
            </div>
          );
        })}
      </div>
    </main>
  );
}


