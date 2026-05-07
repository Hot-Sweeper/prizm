"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { PrizmLogo } from "@/components/prizm-logo";
import { MagicWand as Wand2, Image as Images, CreditCard } from "@phosphor-icons/react/dist/ssr";

type DashboardTab = "studio" | "gallery" | "billing";

const NAV_LINKS = [
  { label: "Studio", tab: "studio", Icon: Wand2 },
  { label: "Gallery", tab: "gallery", Icon: Images },
  { label: "Billing", tab: "billing", Icon: CreditCard },
] as const;

function parseHashToTab(hash: string): DashboardTab {
  const raw = hash.replace(/^#/, "");
  const firstSegment = raw.split("#")[0]?.toLowerCase();
  if (firstSegment === "gallery") return "gallery";
  if (firstSegment === "billing") return "billing";
  return "studio";
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const [hashTab, setHashTab] = useState<DashboardTab>("studio");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateHash = () => {
      setHashTab(parseHashToTab(window.location.hash));
    };

    updateHash();
    window.addEventListener("hashchange", updateHash);
    return () => window.removeEventListener("hashchange", updateHash);
  }, []);

  function handleTabClick(tab: DashboardTab) {
    if (typeof window === "undefined") return;
    if (window.location.pathname !== "/generate") {
      window.location.assign(`/generate#${tab}`);
      return;
    }
    window.location.hash = tab;
  }

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
        prefetch={false}
        aria-label="Go to PRIZM home page"
        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", textDecoration: "none", marginBottom: "2rem" }}
      >
        <PrizmLogo size={24} style={{ color: "var(--color-secondary)" }} aria-hidden="true" />
      </Link>

      <nav aria-label="Main navigation" style={{ width: "100%", flex: 1 }}>
        <ul style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", listStyle: "none", width: "100%", padding: 0, margin: 0 }} role="list">
          {NAV_LINKS.map(({ label, tab, Icon }) => {
            const isActive = pathname.startsWith("/generate")
              ? hashTab === tab
              : (pathname.startsWith("/gallery") && tab === "gallery") ||
                (pathname.startsWith("/billing") && tab === "billing");
            return (
              <li key={tab} style={{ width: "100%", display: "flex", justifyContent: "center" }}>
                <button
                  type="button"
                  onClick={() => handleTabClick(tab)}
                  aria-label={label}
                  title={label}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: "48px", height: "48px",
                    borderRadius: "1rem",
                    color: isActive ? "#fff" : "rgba(255,255,255,0.45)",
                    background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
                    border: isActive ? "1px solid rgba(255,255,255,0.12)" : "1px solid transparent",
                    padding: 0,
                    transition: "all 0.2s ease",
                    cursor: "pointer",
                  }}
                >
                  <Icon size={22} weight={isActive ? "fill" : "regular"} aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
