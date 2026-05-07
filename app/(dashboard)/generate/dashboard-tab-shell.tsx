"use client";

import { useEffect, useState } from "react";
import { GenerateClient } from "./generate-client";
import { GalleryPageClient } from "../gallery/gallery-page-client";
import { BillingPageClient } from "../billing/billing-page-client";

type DashboardTab = "studio" | "gallery" | "billing";

function parseHashToTab(hash: string): DashboardTab {
  const normalized = hash.replace(/^#/, "").toLowerCase();
  if (normalized === "gallery") return "gallery";
  if (normalized === "billing") return "billing";
  return "studio";
}

export function DashboardTabShell() {
  const [tab, setTab] = useState<DashboardTab>("studio");

  useEffect(() => {
    const updateFromHash = () => {
      setTab(parseHashToTab(window.location.hash));
    };

    updateFromHash();
    window.addEventListener("hashchange", updateFromHash);
    return () => window.removeEventListener("hashchange", updateFromHash);
  }, []);

  if (tab === "gallery") return <GalleryPageClient />;
  if (tab === "billing") return <BillingPageClient />;

  return (
    <main id="maincontent" tabIndex={-1} style={{ height: "100%", overflow: "hidden", display: "flex" }}>
      <GenerateClient
        userTier="free"
        imageBalance={0}
        videoBalance={0}
        isWhitelisted={false}
        initialHistory={[]}
      />
    </main>
  );
}
