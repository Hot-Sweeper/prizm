import { signIn } from "@/auth";
import Link from "next/link";
import { PrizmLogo } from "@/components/prizm-logo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In — PRIZM",
};

const BG = "#030303";
const V  = "var(--color-primary)";
const VL = "var(--color-secondary)";

export default function LoginPage() {
  return (
    <div
      style={{
        minHeight: "100svh",
        background: `radial-gradient(ellipse 120% 60% at 50% -5%, rgba(109,40,217,0.35) 0%, transparent 60%), ${BG}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1rem",
        fontFamily: "var(--font-sans)",
        color: "#fff",
      }}
    >
      {/* Logo */}
      <Link
        href="/"
        aria-label="PRIZM home"
        style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2.25rem", textDecoration: "none" }}
      >
        <PrizmLogo size={22} style={{ color: VL }} aria-hidden="true" />
        <span style={{ fontFamily: "var(--font-display)", fontSize: "1.35rem", letterSpacing: "0.1em", color: "#fff" }}>
          PRIZM
        </span>
      </Link>

      {/* Card */}
      <main
        id="maincontent"
        tabIndex={-1}
        style={{
          width: "100%",
          maxWidth: "400px",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "1.5rem",
          padding: "2.25rem",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "2.5rem",
            letterSpacing: "0.04em",
            marginBottom: "0.375rem",
          }}
        >
          SIGN IN
        </h1>
        <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.4)", marginBottom: "2rem" }}>
          Create viral AI content in seconds.
        </p>

        {/* ── Credentials form (dummy — any email / any password works) ── */}
        <form
          action={async (formData: FormData) => {
            "use server";
            await signIn("credentials", {
              email:      String(formData.get("email")    ?? ""),
              password:   String(formData.get("password") ?? ""),
              redirectTo: "/generate",
            });
          }}
          style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label
              htmlFor="email"
              style={{ fontSize: "0.7rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase" }}
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="dev@example.com"
              required
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "0.75rem",
                padding: "11px 14px",
                fontSize: "0.9375rem",
                color: "#fff",
                outline: "none",
                width: "100%",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label
              htmlFor="password"
              style={{ fontSize: "0.7rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase" }}
            >
              Password{" "}
              <span style={{ fontWeight: 400, textTransform: "none", color: "rgba(255,255,255,0.22)", fontSize: "0.7rem" }}>
                (anything works)
              </span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              required
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "0.75rem",
                padding: "11px 14px",
                fontSize: "0.9375rem",
                color: "#fff",
                outline: "none",
                width: "100%",
              }}
            />
          </div>

          <button
            type="submit"
            className="cta-primary"
            style={{
              marginTop: "0.25rem",
              width: "100%",
              background: V,
              color: "var(--color-primary-text)",
              border: "none",
              borderRadius: "999px",
              padding: "13px 24px",
              fontSize: "0.9375rem",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: `0 0 28px ${V}55`,
            }}
          >
            Sign In
          </button>
        </form>

        <p style={{ marginTop: "1.75rem", textAlign: "center", fontSize: "0.75rem", color: "rgba(255,255,255,0.18)", lineHeight: 1.6 }}>
          By signing in you agree to our Terms of Service and Privacy Policy.
        </p>
      </main>
    </div>
  );
}



