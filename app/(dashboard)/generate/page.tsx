import { GenerateClient } from "./generate-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Generate — PRIZM",
  description: "Create viral AI images and videos",
};

export default function GeneratePage() {
  return (
    <main id="maincontent" tabIndex={-1} style={{ height: "100%", overflow: "hidden", display: "flex" }}>
      {/* PRIZM-BUILD: client-bootstrap */}
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
