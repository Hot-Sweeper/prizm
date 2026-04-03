"use client";

import { useState } from "react";
import { GenerationForm } from "@/components/features/generation/generation-form";
import type { DirectResult, ApiInfo } from "@/components/features/generation/generation-form";
import { QueueStatus } from "@/components/features/generation/queue-status";
import { CreditDisplay } from "@/components/features/generation/credit-display";
import { Sparkle as Sparkles, Timer, CurrencyDollar, Cpu, Lightning } from "@phosphor-icons/react/dist/ssr";

interface GenerateClientProps {
  userTier: "free" | "pro" | "max";
  imageBalance: number;
  videoBalance: number;
}

const VL = "var(--color-secondary)";
const V = "var(--color-primary)";

function ApiCostPanel({ apiInfo }: { apiInfo: ApiInfo }) {
  return (
    <div
      style={{
        marginTop: "1rem",
        background: "rgba(124,58,237,0.08)",
        border: "1px solid rgba(167,139,250,0.2)",
        borderRadius: "0.875rem",
        padding: "1rem 1.25rem",
      }}
    >
      <h3
        style={{
          fontSize: "0.7rem",
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "rgba(167,139,250,0.7)",
          marginBottom: "0.75rem",
        }}
      >
        API Cost Breakdown
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
        <CostRow icon={<Cpu size={13} aria-hidden />} label="Model" value={apiInfo.modelName} />
        <CostRow icon={<Lightning size={13} aria-hidden />} label="Provider" value={apiInfo.provider} />
        <CostRow
          icon={<Timer size={13} aria-hidden />}
          label="Time"
          value={`${(apiInfo.generationTimeMs / 1000).toFixed(1)}s`}
        />
        <CostRow
          icon={<CurrencyDollar size={13} aria-hidden />}
          label="Est. Cost"
          value={apiInfo.estimatedCostUSD != null ? `$${apiInfo.estimatedCostUSD.toFixed(3)}` : "N/A"}
          highlight
        />
      </div>
      {apiInfo.usage != null && (
        <div style={{ marginTop: "0.6rem", padding: "0.5rem 0.6rem", background: "rgba(0,0,0,0.2)", borderRadius: "0.5rem", fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", fontFamily: "monospace", wordBreak: "break-all" }}>
          <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{JSON.stringify(apiInfo.usage, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

function CostRow({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <span style={{ color: "rgba(167,139,250,0.5)", flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: "0.725rem", color: "rgba(255,255,255,0.35)" }}>{label}</span>
      <span style={{ marginLeft: "auto", fontSize: "0.8rem", fontWeight: highlight ? 700 : 600, color: highlight ? VL : "rgba(255,255,255,0.75)" }}>
        {value}
      </span>
    </div>
  );
}

export function GenerateClient({
  userTier,
  imageBalance,
  videoBalance,
}: GenerateClientProps) {
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [latestResultUrl, setLatestResultUrl] = useState<string | null>(null);
  const [latestResultType, setLatestResultType] = useState<string | null>(null);
  const [latestApiInfo, setLatestApiInfo] = useState<ApiInfo | null>(null);

  function handleDirectResult(result: DirectResult) {
    setActiveJobId(null);
    setLatestResultUrl(result.url);
    setLatestResultType(result.type);
    setLatestApiInfo(result.apiInfo);
  }

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
            setLatestApiInfo(null);
          }}
          onDirectResult={handleDirectResult}
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
            onComplete={(url) => {
              setActiveJobId(null);
              setLatestResultUrl(url);
              setLatestResultType("image");
              setLatestApiInfo(null);
            }}
          />
        ) : latestResultUrl ? (
          <div>
            {latestResultType === "video" ? (
              <video
                src={latestResultUrl}
                controls
                autoPlay
                loop
                muted
                playsInline
                style={{ width: "100%", borderRadius: "1rem", border: "1px solid rgba(255,255,255,0.07)" }}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={latestResultUrl}
                alt="Generated content"
                style={{ width: "100%", borderRadius: "1rem", border: "1px solid rgba(255,255,255,0.07)" }}
              />
            )}
            {latestApiInfo && <ApiCostPanel apiInfo={latestApiInfo} />}
          </div>
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

      <style>{`
        @media (max-width: 800px) {
          .generate-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}


