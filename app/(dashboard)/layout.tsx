import type { ReactNode } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "./dashboard-sidebar";

function withTimeout<T>(p: Promise<T>, fallback: T, ms = 5000): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((res) =>
      setTimeout(() => {
        console.error(`[PRIZM][SSR] DashboardLayout auth() TIMEOUT after ${ms}ms`);
        res(fallback);
      }, ms)
    ),
  ]);
}

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  console.log("[PRIZM][SSR] DashboardLayout: start");
  let session;
  try {
    session = await withTimeout(auth(), null, 5000);
  } catch (err) {
    console.error("[PRIZM][SSR] DashboardLayout auth() threw:", err);
    session = null;
  }
  console.log("[PRIZM][SSR] DashboardLayout auth() done, user:", session?.user?.id ?? "none");
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div style={{ height: "100svh", display: "flex", background: "#030303", fontFamily: "var(--font-sans)", overflow: "hidden" }}>
      <DashboardSidebar />
      <main style={{ flex: 1, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {children}
      </main>
    </div>
  );
}



