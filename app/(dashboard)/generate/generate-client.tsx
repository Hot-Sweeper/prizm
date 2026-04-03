"use client";

import { useState } from "react";
import { GenerationForm } from "@/components/features/generation/generation-form";
import type { DirectResult, ApiInfo } from "@/components/features/generation/generation-form";
import { QueueStatus } from "@/components/features/generation/queue-status";
import { CreditDisplay } from "@/components/features/generation/credit-display";
import { Sparkle as Sparkles, Timer, CurrencyDollar, Cpu, Lightning, Clock } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";

interface GenerationJob {
  id: string;
  type: string;
  status: string;
  modelId: string | null;
  prompt: string;
  resultUrl: string | null;
  errorMessage: string | null;
  creditCost: number;
  createdAt: Date | string | null;
}

interface GenerateClientProps {
  userTier: "free" | "pro" | "max";
  imageBalance: number;
  videoBalance: number;
  isWhitelisted?: boolean;
  initialHistory: GenerationJob[];
}

const VL = "var(--color-secondary)";

export function GenerateClient({
  userTier,
  imageBalance,
  videoBalance,
  isWhitelisted = false,
  initialHistory,
}: GenerateClientProps) {
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [latestResultUrl, setLatestResultUrl] = useState<string | null>(null);
  const [latestResultType, setLatestResultType] = useState<string | null>(null);
  const [history, setHistory] = useState<GenerationJob[]>(initialHistory);

  function handleDirectResult(result: DirectResult) {
    setActiveJobId(null);
    setLatestResultUrl(result.url);
    setLatestResultType(result.type);
    
    const newJob: GenerationJob = {
      id: crypto.randomUUID(), 
      type: result.type,
      status: "completed",
      modelId: result.apiInfo.model,
      prompt: "Direct Generation", 
      resultUrl: result.url,
      errorMessage: null,
      creditCost: 0,
      createdAt: new Date().toISOString(),
    };
    setHistory((prev) => [newJob, ...prev]);
  }

  function handleJobCreated(jobId: string, prompt: string, type: string) {
    setActiveJobId(jobId);
    setLatestResultUrl(null);
    const newJob: GenerationJob = {
      id: jobId,
      type,
      status: "pending",
      modelId: null,
      prompt,
      resultUrl: null,
      errorMessage: null,
      creditCost: 0,
      createdAt: new Date().toISOString(),
    };
    setHistory((prev) => [newJob, ...prev]);
  }

  return (
    <div style={{ flex: 1, display: "flex", height: "100%", overflow: "hidden", width: "100%" }}>
      {/* Center Stage */}
      <div style={{ flex: 1, position: "relative", display: "flex", flexDirection: "column", background: "#060606" }}>
        
        {/* Canvas / Latest Result Area */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", paddingBottom: "160px" }}>
          {!latestResultUrl && !activeJobId ? (
            <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
              <div style={{ width: "80px", height: "80px", borderRadius: "2rem", background: "rgba(124,58,237,0.06)", border: "1px solid rgba(167,139,250,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: VL }}>
                <Sparkles size={36} weight="duotone" aria-hidden />
              </div>
              <div>
                <h2 className="font-display" style={{ fontSize: "2rem", color: "#fff", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>YOUR STUDIO</h2>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "1rem", maxWidth: "400px", margin: "0 auto" }}>
                  Write a prompt below to create stunning AI images or videos.
                </p>
              </div>
            </div>
          ) : latestResultUrl ? (
            <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1.5rem" }}>
               {latestResultType === "video" ? (
                 <video src={latestResultUrl} controls autoPlay loop style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: "1rem", boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }} />
               ) : (
                 <Image src={latestResultUrl} alt="Generated AI content" width={1024} height={1024} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: "1rem", boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }} unoptimized />
               )}
            </div>
          ) : (
             <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem" }}>
                <div style={{ width: "48px", height: "48px", border: `2px solid ${VL}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                <p style={{ color: VL, fontWeight: 500, letterSpacing: "0.05em" }}>PROCESSING EXPERIMENT...</p>
             </div>
          )}
        </div>

        {/* Floating Chat/Prompt Bar */}
        <div style={{ position: "absolute", bottom: "2rem", left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "800px", zIndex: 10 }}>
          <div style={{ background: "rgba(10,10,10,0.85)", backdropFilter: "blur(24px) saturate(200%)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "2rem", padding: "1.5rem", boxShadow: "0 20px 40px rgba(0,0,0,0.6)" }}>
            <GenerationForm
              userTier={userTier}
              imageBalance={imageBalance}
              videoBalance={videoBalance}
              isWhitelisted={isWhitelisted}
              onJobCreated={(jobId, prompt, type) => handleJobCreated(jobId, prompt, type)}
              onDirectResult={(res, prompt, type) => {
                setActiveJobId(null);
                setLatestResultUrl(res.url);
                setLatestResultType(res.type);
                const newJob: GenerationJob = {
                  id: crypto.randomUUID(),
                  type: type,
                  status: "completed",
                  modelId: res.apiInfo.model,
                  prompt: prompt ?? "Direct Generation",
                  resultUrl: res.url,
                  errorMessage: null,
                  creditCost: 0,
                  createdAt: new Date().toISOString(),
                };
                setHistory((prev) => [newJob, ...prev]);
              }}
            />
          </div>
        </div>
      </div>

      {/* Right Sidebar: Library & Queue */}
      <div style={{ width: "380px", flexShrink: 0, background: "rgba(3,3,3,0.9)", borderLeft: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", zIndex: 20 }}>
        <div style={{ padding: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <h3 className="font-display" style={{ fontSize: "1.25rem", color: "#fff", letterSpacing: "0.05em" }}>TOOLS &amp; CREDITS</h3>
          <CreditDisplay imageBalance={imageBalance} videoBalance={videoBalance} />
        </div>
        
        <div style={{ padding: "1.5rem 1.5rem 0.5rem 1.5rem" }}>
          <h3 className="font-display" style={{ fontSize: "1.25rem", color: "#fff", letterSpacing: "0.05em" }}>QUEUE &amp; LIBRARY</h3>
        </div>

        <div className="model-picker-scrollbar" style={{ flex: 1, overflowY: "auto", padding: "0.5rem 1.5rem 1.5rem 1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          {activeJobId && (
            <div style={{ padding: "1rem", background: "rgba(124,58,237,0.1)", border: `1px solid ${VL}`, borderRadius: "1rem" }}>
              <div style={{ fontSize: "0.75rem", color: VL, fontWeight: 700, letterSpacing: "0.05em", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div style={{ width: "8px", height: "8px", background: VL, borderRadius: "50%", animation: "pulse 1.5s infinite" }} />
                ACTIVE GENERATION
              </div>
              <QueueStatus jobId={activeJobId} onComplete={(url) => { setActiveJobId(null); setLatestResultUrl(url); }} />
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {history.map((job) => (
              <div key={job.id} onClick={() => { if(job.resultUrl) { setLatestResultUrl(job.resultUrl); setLatestResultType(job.type); } }} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "1rem", overflow: "hidden", display: "flex", flexDirection: "column", cursor: job.resultUrl ? "pointer" : "default" }}>
                {job.resultUrl ? (
                  <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", background: "#000" }}>
                    {job.type === "video" ? (
                      <video src={job.resultUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <Image src={job.resultUrl} alt={job.prompt} fill style={{ objectFit: "cover" }} unoptimized />
                    )}
                  </div>
                ) : (
                   <div style={{ padding: "1.5rem", display: "flex", alignItems: "center", justifyContent: "center", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.3)" }}>
                     {job.status === "failed" ? (
                       <span style={{ color: "var(--color-danger)", fontSize: "0.8rem", fontWeight: 600 }}>FAILED</span>
                     ) : (
                       <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "rgba(255,255,255,0.5)" }}>
                         <Clock size={16} /> <span style={{ fontSize: "0.8rem", fontWeight: 500 }}>{job.status.toUpperCase()}</span>
                       </div>
                     )}
                   </div>
                )}
                <div style={{ padding: "0.75rem 1rem", fontSize: "0.8rem", color: "rgba(255,255,255,0.6)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {job.prompt}
                </div>
              </div>
            ))}
            {history.length === 0 && !activeJobId && (
              <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.3)", textAlign: "center", marginTop: "2rem" }}>
                Your generated images will appear here.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


