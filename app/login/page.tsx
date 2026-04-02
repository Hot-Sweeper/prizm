import { signIn } from "@/auth";
import Link from "next/link";
import { PrizmLogo } from "@/components/prizm-logo";
import { Sparkle as Sparkles } from "@phosphor-icons/react/dist/ssr";
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

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }} aria-hidden>
          <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }} />
          <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.2)", fontWeight: 500 }}>or continue with</span>
          <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }} />
        </div>

        {/* OAuth buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/generate" });
            }}
          >
            <button
              type="submit"
              style={{
                width: "100%",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.09)",
                borderRadius: "0.875rem",
                padding: "12px 20px",
                fontSize: "0.9rem", fontWeight: 600,
                color: "rgba(255,255,255,0.75)",
                cursor: "pointer",
              }}
            >
              <svg aria-hidden="true" width="17" height="17" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Google
            </button>
          </form>

          <form
            action={async () => {
              "use server";
              await signIn("github", { redirectTo: "/generate" });
            }}
          >
            <button
              type="submit"
              style={{
                width: "100%",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.09)",
                borderRadius: "0.875rem",
                padding: "12px 20px",
                fontSize: "0.9rem", fontWeight: 600,
                color: "rgba(255,255,255,0.75)",
                cursor: "pointer",
              }}
            >
              <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.92.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub
            </button>
          </form>
        </div>

        <p style={{ marginTop: "1.75rem", textAlign: "center", fontSize: "0.75rem", color: "rgba(255,255,255,0.18)", lineHeight: 1.6 }}>
          By signing in you agree to our Terms of Service and Privacy Policy.
        </p>
      </main>
    </div>
  );
}



