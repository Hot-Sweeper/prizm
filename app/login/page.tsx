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

        {/* ── Divider ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "0.25rem 0 1.25rem" }}>
          <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }} />
          <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "rgba(255,255,255,0.2)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            or continue with
          </span>
          <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }} />
        </div>

        {/* ── OAuth buttons (coming soon) ── */}
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            type="button"
            disabled
            aria-label="Sign in with Google (coming soon)"
            style={{
              flex: 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              padding: "11px 14px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "0.75rem",
              color: "rgba(255,255,255,0.2)",
              fontSize: "0.875rem", fontWeight: 500,
              cursor: "not-allowed", opacity: 0.5,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" fill="currentColor" fillOpacity="0.5"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" fill="currentColor" fillOpacity="0.4"/>
              <path d="M5.84 14.09A6.97 6.97 0 0 1 5.47 12c0-.72.13-1.43.37-2.09V7.07H2.18A11.96 11.96 0 0 0 0 12c0 1.94.46 3.77 1.28 5.39l3.56-2.84.01-.46Z" fill="currentColor" fillOpacity="0.3"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.99 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z" fill="currentColor" fillOpacity="0.5"/>
            </svg>
            Google
          </button>

          <button
            type="button"
            disabled
            aria-label="Sign in with GitHub (coming soon)"
            style={{
              flex: 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              padding: "11px 14px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "0.75rem",
              color: "rgba(255,255,255,0.2)",
              fontSize: "0.875rem", fontWeight: 500,
              cursor: "not-allowed", opacity: 0.5,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
            </svg>
            GitHub
          </button>
        </div>

        <p style={{ fontSize: "0.65rem", textAlign: "center", color: "rgba(255,255,255,0.15)", marginTop: "0.5rem" }}>
          OAuth providers coming soon
        </p>

        <p style={{ marginTop: "1.25rem", textAlign: "center", fontSize: "0.75rem", color: "rgba(255,255,255,0.18)", lineHeight: 1.6 }}>
          By signing in you agree to our Terms of Service and Privacy Policy.
        </p>
      </main>
    </div>
  );
}



