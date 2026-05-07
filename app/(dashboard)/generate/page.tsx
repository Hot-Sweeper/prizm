import { DashboardTabShell } from "./dashboard-tab-shell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Generate — PRIZM",
  description: "Create viral AI images and videos",
};

export default function GeneratePage() {
  return <DashboardTabShell />;
}
