import type { ReactNode } from "react";
import { DashboardSidebar } from "./dashboard-sidebar";

// Auth redirect is handled by middleware (proxy.ts) — no need to call auth() here.
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ height: "100svh", display: "flex", background: "#030303", fontFamily: "var(--font-sans)", overflow: "hidden" }}>
      <DashboardSidebar />
      <main style={{ flex: 1, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {children}
      </main>
    </div>
  );
}



