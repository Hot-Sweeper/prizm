"use client";

import { useState } from "react";
import { GenerationForm } from "@/components/features/generation/generation-form";
import { QueueStatus } from "@/components/features/generation/queue-status";
import { CreditDisplay } from "@/components/features/generation/credit-display";
import { Sparkle as Sparkles } from "@phosphor-icons/react/dist/ssr";

interface GenerateClientProps {
  userTier: "free" | "pro" | "max";
  imageBalance: number;
  videoBalance: number;
}

const VL = "var(--color-secondary)";

export function GenerateClient({
  userTier,
  imageBalance,
  videoBalance,
}: GenerateClientProps) {
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [latestResultUrl, setLatestResultUrl] = useState<string | null>(null);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", alignItems: "start" }}>
      {/* Left — form panel */}
      <div
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "1.5rem",
          padding: "1.75rem",
          display: "flex", flexDirection: "column", gap: "1.5rem",
        }}
      >
        {/* Panel header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "10px",
              background: "rgba(124,58,237,0.15)",
              border: "1px solid rgba(167,139,250,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: VL,
            }}>
              <Sparkles size={16} aria-hidden />
            </div>
            <h1 className="font-display" style={{ fontSize: "1.85rem", letterSpacing: "0.06em", color: "#fff" }}>
              GENERATE
            </h1>
          </div>
          <CreditDisplay imageBalance={imageBalance} videoBalance={videoBalance} />
        </div>

        <GenerationForm
          userTier={userTier}
          imageBalance={imageBalance}
          videoBalance={videoBalance}
          onJobCreated={(jobId) => {
            setActiveJobId(jobId);
            setLatestResultUrl(null);
          }}
        />
      </div>

      {/* Right — result panel */}
      <div
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "1.5rem",
          padding: "1.75rem",
          minHeight: "480px",
          display: "flex", flexDirection: "column",
        }}
      >
        <h2
          className="font-display"
          style={{ fontSize: "1.3rem", letterSpacing: "0.06em", color: "rgba(255,255,255,0.6)", marginBottom: "1.25rem" }}
        >
          {activeJobId ? "GENERATING" : "RESULT"}
        </h2>

        {activeJobId ? (
          <QueueStatus
            jobId={activeJobId}
            onComplete={(url) => setLatestResultUrl(url)}
          />
        ) : latestResultUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={latestResultUrl}
            alt="Generated content"
            style={{ width: "100%", borderRadius: "1rem", border: "1px solid rgba(255,255,255,0.07)" }}
          />
        ) : (
          <div
            style={{
              flex: 1,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: "0.75rem",
              border: "1px dashed rgba(255,255,255,0.08)",
              borderRadius: "1rem",
              color: "rgba(255,255,255,0.2)",
            }}
          >
            <Sparkles size={28} style={{ color: "rgba(167,139,250,0.3)" }} aria-hidden />
            <p style={{ fontSize: "0.875rem" }}>Your generated content will appear here</p>
          </div>
        )}
      </div>

      {/* Responsive stacking */}
      <style>{`
        @media (max-width: 800px) {
          .generate-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}


