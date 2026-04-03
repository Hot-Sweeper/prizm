"use client";

import { useState } from "react";
import Image from "next/image";
import { DownloadSimple, ArrowCounterClockwise, Clock } from "@phosphor-icons/react/dist/ssr";
import { getModelInfo } from "@/lib/ai/models";
import { ModelBrandIcon } from "./model-brand-icon";

interface Job {
  id: string;
  type: string;
  status: string;
  modelId: string | null;
  prompt: string;
  resultUrl: string | null;
  createdAt: string;
  errorMessage?: string | null;
}

export function HistoryCard({
  job,
  onClick,
  onUseSetup,
}: {
  job: Job;
  onClick: () => void;
  onUseSetup: (job: Job) => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const modelInfo = job.modelId ? getModelInfo(job.modelId) : null;

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.05)",
        borderRadius: "1rem",
        display: "flex",
        flexDirection: "column",
        cursor: job.resultUrl ? "pointer" : "default",
        perspective: "1000px",
      }}
    >
      <div 
        style={{ 
          position: "relative", 
          width: "100%", 
          background: "#000",
          transition: "transform 0.6s",
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          borderRadius: "1rem 1rem 0 0",
        }}
      >
        {/* Front Face */}
        <div 
          onClick={(e) => {
             if ((e.target as HTMLElement).closest(".prevent-flip")) return;
             if (job.resultUrl) setFlipped(!flipped);
             onClick(); 
          }}
          style={{ width: "100%", backfaceVisibility: "hidden", borderRadius: "1rem 1rem 0 0", overflow: "hidden" }}
        >
           {job.resultUrl ? (
             <div style={{ position: "relative", width: "100%", aspectRatio: "16/9" }}>
               {job.type === "video" ? (
                 <video src={job.resultUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
               ) : (
                 <Image src={job.resultUrl} alt={job.prompt} fill style={{ objectFit: "cover" }} unoptimized />
               )}
               {/* Controls overlaid */}
               <div className="prevent-flip" style={{ position: "absolute", top: "8px", right: "8px", zIndex: 10 }}>
                 <a 
                   href={job.resultUrl} 
                   download 
                   target="_blank"
                   style={{ display: "flex", padding: "6px", background: "rgba(0,0,0,0.5)", borderRadius: "0.5rem", color: "#fff", backdropFilter: "blur(4px)" }}
                   onClick={e => e.stopPropagation()}
                 >
                   <DownloadSimple size={16} />
                 </a>
               </div>
               {modelInfo && (
                  <div style={{ position: "absolute", bottom: "8px", left: "8px", zIndex: 10, background: "rgba(0,0,0,0.5)", borderRadius: "999px", padding: "4px", display: "flex", backdropFilter: "blur(4px)" }}>
                    <ModelBrandIcon model={modelInfo} active={false} />
                  </div>
               )}
             </div>
           ) : (
             <div style={{ padding: "1.5rem", display: "flex", alignItems: "center", justifyContent: "center", aspectRatio: "16/9", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.3)" }}>
               {job.status === "failed" ? (
                 <div style={{ color: "#ef4444", fontSize: "0.875rem", textAlign: "center" }}>
                   <div style={{ marginBottom: "0.5rem" }}>⚠️ Failed</div>
                   <div style={{ fontSize: "0.75rem", opacity: 0.8 }}>{job.errorMessage || "Unknown error"}</div>
                 </div>
               ) : (
                 <div style={{ color: "var(--color-secondary)", fontSize: "0.875rem" }}>Processing...</div>
               )}
             </div>
           )}
        </div>

        {/* Back Face */}
        <div 
          onClick={() => setFlipped(!flipped)}
          style={{ 
            position: "absolute", top: 0, left: 0, width: "100%", height: "100%", 
            backfaceVisibility: "hidden", transform: "rotateY(180deg)", 
            background: "rgba(10,10,10,0.9)", padding: "1rem", overflowY: "auto",
            display: "flex", flexDirection: "column",
            borderRadius: "1rem 1rem 0 0"
          }}
        >
          <div style={{ flex: 1 }}>
            <h4 style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginBottom: "4px", textTransform: "uppercase" }}>Prompt</h4>
            <p style={{ fontSize: "0.875rem", color: "#fff", lineHeight: 1.4, marginBottom: "12px", wordBreak: "break-word" }}>{job.prompt}</p>

            <h4 style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginBottom: "4px", textTransform: "uppercase" }}>Model</h4>
            <div style={{ fontSize: "0.875rem", color: "#fff", display: "flex", alignItems: "center", gap: "6px" }}>{modelInfo?.displayName || job.modelId || "Unknown"}</div>
          </div>

          <div className="prevent-flip" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <button 
              onClick={(e) => { e.stopPropagation(); onUseSetup(job); }}
              style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", padding: "6px 12px", borderRadius: "999px", background: "rgba(255,255,255,0.1)", color: "#fff", border: "none", cursor: "pointer" }}
            >
              <ArrowCounterClockwise size={14} /> Use Setup
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.65rem", color: "rgba(255,255,255,0.3)" }}>
              <Clock size={12} /> {new Date(job.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.875rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {job.prompt}
          </p>
        </div>
      </div>
    </div>
  );
}
