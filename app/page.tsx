import Link from "next/link";
import { PrizmLogo } from "@/components/prizm-logo";
import { auth } from "@/auth";
import type { Metadata } from "next";
import {
  ArrowRight,
  Check,
  CaretRight as ChevronRight,
  DownloadSimple as Download,
  Image as ImageIcon,
  Lock,
  PencilSimple as Pencil,
  Sparkle as Sparkles,
  VideoCamera as Video,
} from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: "PRIZM — Create Viral AI Content",
  description:
    "Generate viral AI images and videos using Sora 2, Flux 2, Kling 2.5, and Veo 3.1. The creative engine that makes creators go viral.",
};

// ─── Static data ────────────────────────────────────────────────────────────

const IMAGE_MODELS = [
  { name: "DALL-E 3",           tier: "FREE", cost: "1 cr", desc: "Fast, versatile image generation" },
  { name: "GPT Image",          tier: "PRO",  cost: "2 cr", desc: "OpenAI's most advanced image model" },
] as const;

const VIDEO_MODELS = [
  { name: "Kling 2.5", tier: "PRO",  cost: "3 cr", desc: "High-quality motion, physics-aware" },
  { name: "Sora 2",    tier: "PRO",  cost: "5 cr", desc: "OpenAI's flagship video generation" },
  { name: "Veo 3.1",   tier: "MAX",  cost: "4 cr", desc: "Google's cinematic video model" },
] as const;

const PLANS = [
  {
    name: "Free",
    price: 0,
    features: ["10 image credits / mo", "DALL-E 3 model access", "Community queue", "Gallery & downloads"],
    cta: "Start Free",
    highlight: false,
  },
  {
    name: "Pro",
    price: 19,
    features: ["100 image credits / mo", "10 video credits / mo", "DALL-E 3 + GPT Image", "Kling 2.5 + Sora 2", "Priority queue"],
    cta: "Go Pro",
    highlight: true,
  },
  {
    name: "Max",
    price: 49,
    features: ["500 image credits / mo", "50 video credits / mo", "All 5 models incl. Veo 3.1", "Top-priority queue bypass", "Monthly credit rollover"],
    cta: "Go Max",
    highlight: false,
  },
] as const;

const STEPS = [
  { num: "01", Icon: Pencil,   title: "Write Your Prompt",   desc: "Describe exactly what you want. The more vivid, the better the result." },
  { num: "02", Icon: Sparkles, title: "AI Generates It",     desc: "Your job joins the priority queue. Dedicated GPUs handle the heavy lifting." },
  { num: "03", Icon: Download, title: "Download & Publish",  desc: "Content lands in your gallery — download in one tap and ship it." },
] as const;

// ─── Root colors ─────────────────────────────────────────────────────────────
const V = "var(--color-primary)";       // violet-600
const VL = "var(--color-secondary)";      // violet-400  (light)
const VLL = "var(--color-accent)";     // violet-300  (lighter)
const BG = "#030303";

// ─── Component ───────────────────────────────────────────────────────────────

export default async function LandingPage() {
  const session = await auth();
  const dashHref = session ? "/generate" : "/login";

  return (
    <div style={{ background: BG, color: "#fff", fontFamily: "var(--font-sans)", overflowX: "hidden" }}>

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <header
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
          height: "64px",
          padding: "0 2rem",
          background: "rgba(3,3,3,0.75)",
          backdropFilter: "blur(20px) saturate(180%)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          display: "flex", alignItems: "center",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto", width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>

          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
            <PrizmLogo size={22} style={{ color: VL }} aria-hidden="true" />
            <span className="font-display" style={{ fontSize: "1.4rem", letterSpacing: "0.1em", color: "#fff" }}>
              PRIZM
            </span>
          </div>

          {/* Links + CTA */}
          <nav aria-label="Primary navigation" style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
            <a href="#models"  className="nav-link">Models</a>
            <a href="#pricing" className="nav-link">Pricing</a>
            <Link
              href={dashHref}
              className="cta-primary"
              style={{
                display: "inline-flex", alignItems: "center", gap: "7px",
                background: V, color: "var(--color-primary-text)",
                padding: "9px 20px", borderRadius: "999px",
                fontSize: "0.875rem", fontWeight: 700,
                boxShadow: `0 0 24px ${V}55`,
              }}
            >
              {session ? "Dashboard" : "Start Free"}
              <ArrowRight size={14} aria-hidden />
            </Link>
          </nav>
        </div>
      </header>

      <main id="maincontent" tabIndex={-1}>

        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <section
          aria-label="Hero"
          style={{
            position: "relative",
            minHeight: "100svh",
            display: "flex", alignItems: "center", justifyContent: "center",
            textAlign: "center",
            padding: "80px 2rem 6rem",
            background: `
              radial-gradient(ellipse 160% 70% at 50% -10%, rgba(109,40,217,0.50) 0%, transparent 65%),
              radial-gradient(ellipse 70% 55% at 88% 78%, rgba(79,70,229,0.22) 0%, transparent 55%),
              radial-gradient(ellipse 60% 45% at 8%  88%, rgba(124,58,237,0.12) 0%, transparent 55%),
              ${BG}
            `,
          }}
        >
          {/* dot grid overlay */}
          <div aria-hidden className="dot-grid" style={{ position: "absolute", inset: 0, zIndex: 0 }} />

          {/* content */}
          <div style={{ position: "relative", zIndex: 1, maxWidth: "1050px", width: "100%" }}>

            {/* Badge */}
            <div
              className="anim-fade-up"
              style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                padding: "5px 16px 5px 10px",
                borderRadius: "999px",
                border: `1px solid rgba(167,139,250,0.35)`,
                background: `rgba(124,58,237,0.14)`,
                fontSize: "0.8125rem", fontWeight: 600, color: VLL,
                marginBottom: "2rem",
              }}
            >
              <span
                className="pulse-glow"
                style={{ width: "7px", height: "7px", borderRadius: "50%", background: VL, boxShadow: `0 0 8px ${VL}`, display: "inline-block", flexShrink: 0 }}
              />
              Now available &mdash; Veo 3.1 &amp; Sora 2
            </div>

            {/* Headline */}
            <h1
              className="font-display anim-fade-up anim-delay-1"
              style={{
                fontSize: "clamp(4.2rem, 14vw, 13rem)",
                lineHeight: 0.88,
                letterSpacing: "-0.01em",
                marginBottom: "2.25rem",
                wordBreak: "break-word",
              }}
            >
              CREATE CONTENT
              <br />
              THE WORLD{" "}
              <span className="gradient-shimmer">CAN&apos;T STOP</span>
              <br />
              WATCHING.
            </h1>

            {/* Sub */}
            <p
              className="anim-fade-up anim-delay-2"
              style={{
                fontSize: "clamp(1rem, 2.2vw, 1.2rem)",
                color: "rgba(255,255,255,0.52)",
                lineHeight: 1.75,
                maxWidth: "520px",
                margin: "0 auto 2.75rem",
              }}
            >
              The AI content engine for creators. Viral videos, studio images, and trending
              formats &mdash; generated in seconds. No waitlists. No Discord lobbies.
            </p>

            {/* CTAs */}
            <div
              className="anim-fade-up anim-delay-3"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}
            >
              <Link
                href={dashHref}
                className="cta-primary"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "9px",
                  background: V, color: "var(--color-primary-text)",
                  padding: "15px 32px", borderRadius: "999px",
                  fontSize: "1.0625rem", fontWeight: 800,
                  boxShadow: `0 0 36px ${V}66, 0 0 80px ${V}22`,
                }}
              >
                Start Creating Free
                <ArrowRight size={18} aria-hidden />
              </Link>
              <a
                href="#models"
                className="cta-ghost"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "8px",
                  background: "rgba(255,255,255,0.06)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.8)",
                  padding: "15px 32px", borderRadius: "999px",
                  fontSize: "1.0625rem", fontWeight: 600,
                }}
              >
                See the Models
                <ChevronRight size={18} aria-hidden />
              </a>
            </div>
          </div>

          {/* Scroll indicator */}
          <div
            aria-hidden
            style={{
              position: "absolute", bottom: "2rem", left: "50%", transform: "translateX(-50%)",
              display: "flex", flexDirection: "column", alignItems: "center", gap: "6px",
            }}
          >
            <span style={{ fontSize: "0.6875rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)" }}>scroll</span>
            <div style={{ width: "1px", height: "44px", background: `linear-gradient(to bottom, ${VL}99, transparent)` }} />
          </div>
        </section>

        {/* ── STATS BAR ────────────────────────────────────────────────── */}
        <section
          aria-label="Platform stats"
          style={{
            padding: "3.5rem 2rem",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <dl style={{ maxWidth: "960px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2rem", textAlign: "center" }}>
            {[
              { value: "5",     label: "AI Models",              color: VLL },
              { value: "~5s",   label: "Avg. image generation",  color: VLL },
              { value: "Free",  label: "To start — no card needed", color: VLL },
            ].map((s) => (
              <div key={s.value}>
                <dt className="font-display" style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)", color: "#fff", lineHeight: 1 }}>
                  {s.value}
                </dt>
                <dd style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "rgba(255,255,255,0.38)" }}>
                  {s.label}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
        <section
          aria-labelledby="how-heading"
          style={{ padding: "7rem 2rem", maxWidth: "1200px", margin: "0 auto" }}
        >
          <p style={{ textAlign: "center", fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: VL, marginBottom: "0.875rem" }}>
            How it works
          </p>
          <h2
            id="how-heading"
            className="font-display"
            style={{ textAlign: "center", fontSize: "clamp(2.5rem, 7vw, 5.5rem)", marginBottom: "4rem" }}
          >
            THREE STEPS TO VIRAL
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
            {STEPS.map(({ num, Icon, title, desc }) => (
              <div
                key={num}
                className="step-card"
                style={{
                  padding: "2.5rem",
                  borderRadius: "1.5rem",
                  border: "1px solid rgba(255,255,255,0.07)",
                  background: "rgba(255,255,255,0.025)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Ghost number */}
                <div
                  aria-hidden
                  className="font-display"
                  style={{
                    position: "absolute", top: "-0.5rem", right: "1.25rem",
                    fontSize: "7rem", lineHeight: 1,
                    color: "rgba(255,255,255,0.04)",
                    pointerEvents: "none", userSelect: "none",
                  }}
                >
                  {num}
                </div>

                {/* Icon box */}
                <div style={{
                  width: "48px", height: "48px", borderRadius: "14px",
                  background: `rgba(124,58,237,0.15)`, border: `1px solid rgba(167,139,250,0.22)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: VL, marginBottom: "1.5rem",
                }}>
                  <Icon size={22} aria-hidden />
                </div>

                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.75rem", color: "#fff" }}>
                  {title}
                </h3>
                <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.48)", lineHeight: 1.75 }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── MODEL SHOWCASE ───────────────────────────────────────────── */}
        <section
          id="models"
          aria-labelledby="models-heading"
          style={{
            padding: "7rem 2rem",
            background: `radial-gradient(ellipse 90% 60% at 50% 50%, rgba(109,40,217,0.09) 0%, transparent 70%)`,
            borderTop: "1px solid rgba(255,255,255,0.05)",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <p style={{ textAlign: "center", fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: VL, marginBottom: "0.875rem" }}>
              The arsenal
            </p>
            <h2
              id="models-heading"
              className="font-display"
              style={{ textAlign: "center", fontSize: "clamp(2.5rem, 7vw, 5.5rem)", marginBottom: "0.875rem" }}
            >
              CHOOSE YOUR WEAPON
            </h2>
            <p style={{ textAlign: "center", color: "rgba(255,255,255,0.4)", maxWidth: "440px", margin: "0 auto 3.5rem", lineHeight: 1.7 }}>
              Five hand-picked models for viral imagery and cinematic video. Not demos &mdash; real production tools.
            </p>

            {/* Image models */}
            <div style={{ marginBottom: "2.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.25rem" }}>
                <ImageIcon size={15} style={{ color: "#818cf8" }} aria-hidden />
                <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#818cf8" }}>
                  Image Models
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: "1rem" }}>
                {IMAGE_MODELS.map((m) => (
                  <ModelCard key={m.name} model={m} accent="#818cf8" />
                ))}
              </div>
            </div>

            {/* Video models */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.25rem" }}>
                <Video size={15} style={{ color: VL }} aria-hidden />
                <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: VL }}>
                  Video Models
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: "1rem" }}>
                {VIDEO_MODELS.map((m) => (
                  <ModelCard key={m.name} model={m} accent={VL} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── PRICING ──────────────────────────────────────────────────── */}
        <section
          id="pricing"
          aria-labelledby="pricing-heading"
          style={{ padding: "7rem 2rem" }}
        >
          <div style={{ maxWidth: "1120px", margin: "0 auto" }}>
            <p style={{ textAlign: "center", fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: VL, marginBottom: "0.875rem" }}>
              Pricing
            </p>
            <h2
              id="pricing-heading"
              className="font-display"
              style={{ textAlign: "center", fontSize: "clamp(2.5rem, 7vw, 5.5rem)", marginBottom: "0.875rem" }}
            >
              PICK YOUR PLAN
            </h2>
            <p style={{ textAlign: "center", color: "rgba(255,255,255,0.4)", maxWidth: "400px", margin: "0 auto 4rem", lineHeight: 1.7 }}>
              All plans include full gallery access, unlimited downloads, and cancel-anytime.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.25rem", alignItems: "start" }}>
              {PLANS.map((plan) => (
                <div
                  key={plan.name}
                  className={plan.highlight ? "plan-card-highlight" : ""}
                  style={{
                    padding: "2.25rem",
                    borderRadius: "1.5rem",
                    display: "flex", flexDirection: "column",
                    position: "relative",
                    border: plan.highlight ? `1px solid rgba(167,139,250,0.45)` : "1px solid rgba(255,255,255,0.07)",
                    background: plan.highlight
                      ? `linear-gradient(160deg, rgba(124,58,237,0.2) 0%, rgba(109,40,217,0.07) 100%)`
                      : "rgba(255,255,255,0.025)",
                  }}
                >
                  {/* Most popular badge */}
                  {plan.highlight && (
                    <div
                      style={{
                        position: "absolute", top: "-1px", left: "50%", transform: "translateX(-50%)",
                        background: `linear-gradient(90deg, ${V}, ${VL})`,
                        color: "#fff", fontSize: "0.67rem", fontWeight: 800,
                        letterSpacing: "0.14em", textTransform: "uppercase",
                        padding: "4px 18px", borderRadius: "0 0 10px 10px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Most Popular
                    </div>
                  )}

                  {/* Plan name & price */}
                  <div style={{ marginBottom: "1.75rem", paddingTop: plan.highlight ? "0.5rem" : "0" }}>
                    <div
                      className="font-display"
                      style={{ fontSize: "1.75rem", letterSpacing: "0.06em", color: plan.highlight ? VLL : "#fff", marginBottom: "0.5rem" }}
                    >
                      {plan.name.toUpperCase()}
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                      <span className="font-display" style={{ fontSize: "3.75rem", color: "#fff", lineHeight: 1 }}>
                        ${plan.price}
                      </span>
                      <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.875rem" }}>/mo</span>
                    </div>
                  </div>

                  {/* Features */}
                  <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.875rem", marginBottom: "2rem", flex: 1 }}>
                    {plan.features.map((f) => (
                      <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem", fontSize: "0.9rem", color: "rgba(255,255,255,0.62)" }}>
                        <Check size={15} style={{ color: VL, flexShrink: 0, marginTop: "2px" }} aria-hidden />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Link
                    href={dashHref}
                    className="plan-cta"
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                      padding: "13px 24px", borderRadius: "999px",
                      fontSize: "0.9375rem", fontWeight: 700,
                      background: plan.highlight ? V : "rgba(255,255,255,0.08)",
                      color: plan.highlight ? "var(--color-primary-text)" : "#fff",
                      border: plan.highlight ? "none" : "1px solid rgba(255,255,255,0.1)",
                      boxShadow: plan.highlight ? `0 0 28px ${V}55` : "none",
                    }}
                  >
                    {plan.cta}
                    <ArrowRight size={16} aria-hidden />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA BAND ───────────────────────────────────────────── */}
        <section
          aria-label="Call to action"
          style={{
            margin: "0 1.5rem 5rem",
            padding: "6rem 2rem",
            borderRadius: "2rem",
            background: `
              linear-gradient(135deg,
                rgba(124,58,237,0.38) 0%,
                rgba(109,40,217,0.22) 50%,
                rgba(79,70,229,0.18) 100%)
            `,
            border: "1px solid rgba(167,139,250,0.2)",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* ambient glow */}
          <div
            aria-hidden
            style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              width: "700px", height: "500px",
              background: `radial-gradient(ellipse, rgba(124,58,237,0.28) 0%, transparent 65%)`,
              pointerEvents: "none",
            }}
          />
          <div style={{ position: "relative", zIndex: 1 }}>
            <h2
              className="font-display"
              style={{ fontSize: "clamp(3rem, 9vw, 7.5rem)", lineHeight: 0.9, marginBottom: "1.75rem" }}
            >
              YOUR NEXT VIRAL
              <br />
              POST IS ONE
              <br />
              PROMPT AWAY.
            </h2>
            <p style={{ color: "rgba(255,255,255,0.52)", maxWidth: "400px", margin: "0 auto 2.75rem", fontSize: "1.0625rem", lineHeight: 1.7 }}>
              Start free. No credit card. No waitlist. Just create.
            </p>
            <Link
              href={dashHref}
              className="cta-white"
              style={{
                display: "inline-flex", alignItems: "center", gap: "10px",
                background: "#fff", color: BG,
                padding: "17px 40px", borderRadius: "999px",
                fontSize: "1.0625rem", fontWeight: 800,
              }}
            >
              Start Creating Free
              <ArrowRight size={18} aria-hidden />
            </Link>
          </div>
        </section>
      </main>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "2.5rem 2rem" }}>
        <div style={{
          maxWidth: "1200px", margin: "0 auto",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: "1rem",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "rgba(255,255,255,0.28)", fontSize: "0.875rem", fontWeight: 600 }}>
            <Sparkles size={15} aria-hidden />
            PRIZM
          </div>
          <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.18)" }}>
            © {new Date().getFullYear()} PRIZM Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

// ─── ModelCard ───────────────────────────────────────────────────────────────

function ModelCard({
  model,
  accent,
}: {
  model: { name: string; tier: string; cost: string; desc: string };
  accent: string;
}) {
  return (
    <div
      className="model-card"
      style={{
        "--model-accent": accent,
        padding: "1.5rem",
        borderRadius: "1.25rem",
        border: "1px solid rgba(255,255,255,0.07)",
        background: `${accent}11`,
        display: "flex", flexDirection: "column", gap: "0.75rem",
      } as React.CSSProperties}
    >
      {/* Top row: tag + tier lock */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          style={{
            fontSize: "0.6875rem", fontWeight: 800, letterSpacing: "0.14em",
            textTransform: "uppercase", color: accent,
            background: `${accent}22`, padding: "3px 10px", borderRadius: "999px",
          }}
        >
          {model.tier}
        </span>
        <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: accent }}>
          {model.cost}
        </span>
      </div>

      {/* Model name */}
      <div
        className="font-display"
        style={{ fontSize: "1.625rem", color: "#fff", letterSpacing: "0.03em", lineHeight: 1 }}
      >
        {model.name.toUpperCase()}
      </div>

      {/* Description */}
      <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.42)", lineHeight: 1.65 }}>
        {model.desc}
      </p>

      {/* Locked indicator */}
      {model.tier !== "FREE" && (
        <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "auto", paddingTop: "0.25rem" }}>
          <Lock size={11} style={{ color: "rgba(255,255,255,0.25)" }} aria-hidden />
          <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.25)", fontWeight: 500 }}>
            Requires {model.tier} plan
          </span>
        </div>
      )}
    </div>
  );
}







