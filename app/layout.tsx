import type { Metadata } from "next";
import { Bebas_Neue, Plus_Jakarta_Sans } from "next/font/google";
import { DebugMonitor } from "@/components/features/generation/debug-monitor";
import "./globals.css";

const displayFont = Bebas_Neue({
  variable: "--font-bebas",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const bodyFont = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PRIZM — Create Viral AI Content",
  description:
    "Generate viral AI images and videos using Sora 2, Flux 2, Kling 2.5, and Veo 3.1. The creative engine that makes creators go viral.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body>
        <a href="#maincontent" className="skip-link">
          Skip to main content
        </a>
        {children}
        <DebugMonitor />
      </body>
    </html>
  );
}

