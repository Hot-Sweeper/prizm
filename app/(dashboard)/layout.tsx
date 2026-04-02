import type { ReactNode } from "react";
import Link from "next/link";
import { PrizmLogo } from "@/components/prizm-logo";
import { MagicWand as Wand2, Image as Images, CreditCard } from "@phosphor-icons/react/dist/ssr";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const NAV_LINKS = [
    { href: "/generate", label: "Generate", Icon: Wand2 },
    { href: "/gallery",  label: "Gallery",  Icon: Images },
    { href: "/billing",  label: "Billing",  Icon: CreditCard },
  ] as const;

  return (
    <div style={{ minHeight: "100svh", background: "#030303", fontFamily: "var(--font-sans)" }}>
      <header
        style={{
          position: "sticky", top: 0, zIndex: 40,
          height: "60px",
          padding: "0 1.5rem",
          background: "rgba(3,3,3,0.85)",
          backdropFilter: "blur(20px) saturate(180%)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex", alignItems: "center",
        }}
      >
        <div style={{
          maxWidth: "1280px", margin: "0 auto", width: "100%",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          {/* Logo */}
          <Link
            href="/"
            aria-label="Go to PRIZM home page"
            style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}
          >
            <PrizmLogo size={20} style={{ color: "var(--color-secondary)" }} aria-hidden="true" />
            <span className="font-display" style={{ fontSize: "1.25rem", letterSpacing: "0.1em", color: "#fff" }}>
              PRIZM
            </span>
          </Link>

          {/* Nav */}
          <nav aria-label="Main navigation">
            <ul style={{ display: "flex", alignItems: "center", gap: "2px", listStyle: "none" }} role="list">
              {NAV_LINKS.map(({ href, label, Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    style={{
                      display: "flex", alignItems: "center", gap: "6px",
                      padding: "6px 14px", borderRadius: "999px",
                      fontSize: "0.875rem", fontWeight: 500,
                      color: "rgba(255,255,255,0.55)",
                      textDecoration: "none",
                      transition: "background 0.15s, color 0.15s",
                    }}
                    className="dash-nav-link"
                  >
                    <Icon size={14} aria-hidden />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "2rem 1.5rem" }}>
        {children}
      </div>
    </div>
  );
}



