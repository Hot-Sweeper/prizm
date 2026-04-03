"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PrizmLogo } from "@/components/prizm-logo";
import { MagicWand as Wand2, Image as Images, CreditCard } from "@phosphor-icons/react/dist/ssr";

const NAV_LINKS = [
  { href: "/generate", label: "Studio", Icon: Wand2 },
  { href: "/gallery",  label: "Gallery",  Icon: Images },
  { href: "/billing",  label: "Billing",  Icon: CreditCard },
] as const;

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: "80px",
        flexShrink: 0,
        background: "rgba(3,3,3,0.85)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "1.5rem 0",
        zIndex: 40,
      }}
    >
      <Link
        href="/"
        aria-label="Go to PRIZM home page"
        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", textDecoration: "none", marginBottom: "2rem" }}
      >
        <PrizmLogo size={24} style={{ color: "var(--color-secondary)" }} aria-hidden="true" />
      </Link>

      <nav aria-label="Main navigation" style={{ width: "100%", flex: 1 }}>
        <ul style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", listStyle: "none", width: "100%", padding: 0, margin: 0 }} role="list">
          {NAV_LINKS.map(({ href, label, Icon }) => {
            const isActive = pathname.startsWith(href);
            return (
              <li key={href} style={{ width: "100%", display: "flex", justifyContent: "center" }}>
                <Link
                  href={href}
                  aria-label={label}
                  title={label}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: "48px", height: "48px",
                    borderRadius: "1rem",
                    color: isActive ? "#fff" : "rgba(255,255,255,0.45)",
                    background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
                    border: isActive ? "1px solid rgba(255,255,255,0.12)" : "1px solid transparent",
                    textDecoration: "none",
                    transition: "all 0.2s ease",
                  }}
                >
                  <Icon size={22} weight={isActive ? "fill" : "regular"} aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
