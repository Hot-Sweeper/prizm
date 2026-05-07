"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { GenerationForm } from "@/components/features/generation/generation-form";
import { QueueStatus } from "@/components/features/generation/queue-status";
import { HistoryCard } from "@/components/features/generation/history-card";
import { CreditDisplay } from "@/components/features/generation/credit-display";
import { Sparkle as Sparkles, Image as ImageIcon, FilmSlate } from "@phosphor-icons/react/dist/ssr";
import { getModelInfo } from "@/lib/ai/models";
import { ModelBrandIcon } from "@/components/features/generation/model-brand-icon";
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
  updatedAt?: Date | string | null;
  generationTimeMs?: number;
}

interface HistoryJob {
  id: string;
  type: string;
  status: string;
  modelId: string | null;
  prompt: string;
  resultUrl: string | null;
  createdAt: string;
  updatedAt?: string;
  errorMessage?: string | null;
  generationTimeMs?: number;
}

type QueueJobStatus = "queued" | "processing" | "completed" | "failed";

interface QueueJobPayload {
  id: string;
  status: QueueJobStatus;
  type: "image" | "video" | null;
  prompt: string | null;
  resultUrl: string | null;
  errorMessage: string | null;
  updatedAt?: string | null;
}

interface GenerateClientProps {
  userTier: "free" | "pro" | "max";
  imageBalance: number;
  videoBalance: number;
  isWhitelisted?: boolean;
  initialHistory: GenerationJob[];
}

const VL = "var(--color-secondary)";
const FAST_POLL_MS = 2000;
const SLOW_POLL_MS = 4500;
const FETCH_TIMEOUT_MS = 8000;

function createTimeoutSignal(timeoutMs: number) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  return { signal: controller.signal, clear: () => clearTimeout(timeoutId) };
}

export function GenerateClient({
  userTier,
  imageBalance,
  videoBalance,
  isWhitelisted = false,
  initialHistory,
}: GenerateClientProps) {
  const [activeJobIds, setActiveJobIds] = useState<string[]>([]);
  const [latestResultUrl, setLatestResultUrl] = useState<string | null>(null);
  const [latestResultType, setLatestResultType] = useState<string | null>(null);
  const [history, setHistory] = useState<GenerationJob[]>(initialHistory);

  const jobsById = useMemo(() => {
    const map = new Map<string, GenerationJob>();
    for (const job of history) map.set(job.id, job);
    return map;
  }, [history]);

  const activeJobs = useMemo(
    () =>
      activeJobIds
        .map((id) => jobsById.get(id))
        .filter((job): job is GenerationJob => Boolean(job)),
    [activeJobIds, jobsById]
  );

  const activeJobIdSet = useMemo(() => new Set(activeJobIds), [activeJobIds]);

  const completedHistory = useMemo(
    () => history.filter((job) => !activeJobIdSet.has(job.id)),
    [history, activeJobIdSet]
  );

  const historyCardJobs = useMemo<HistoryJob[]>(
    () =>
      completedHistory.map((job) => ({
        id: job.id,
        type: job.type,
        status: job.status,
        modelId: job.modelId,
        prompt: job.prompt,
        resultUrl: job.resultUrl,
        createdAt:
          typeof job.createdAt === "string"
            ? job.createdAt
            : (job.createdAt ?? new Date()).toISOString(),
        updatedAt:
          typeof job.updatedAt === "string"
            ? job.updatedAt
            : job.updatedAt
              ? job.updatedAt.toISOString()
              : undefined,
        errorMessage: job.errorMessage,
        generationTimeMs: job.generationTimeMs,
      })),
    [completedHistory]
  );

  function handleJobCreated(jobId: string, prompt: string, type: string, modelId: string) {
    console.debug("[PRIZM][queue] job created", { jobId, type, modelId });
    setActiveJobIds((prev) => [jobId, ...prev]);
    setLatestResultUrl(null);
    const newJob: GenerationJob = {
      id: jobId,
      type,
      status: "queued",
      modelId: modelId ?? null,
      prompt,
      resultUrl: null,
      errorMessage: null,
      creditCost: 0,
      createdAt: new Date().toISOString(),
    };
    setHistory((prev) => [newJob, ...prev]);
  }

  const pollQueueStatuses = useCallback(async () => {
    if (activeJobIds.length === 0) return;

    try {
      const timeout = createTimeoutSignal(FETCH_TIMEOUT_MS);
      const res = await fetch("/api/queue/statuses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        signal: timeout.signal,
        body: JSON.stringify({ jobIds: activeJobIds }),
      });
      timeout.clear();

      if (!res.ok) {
        const errorBody = await res.text().catch(() => "");
        console.error("[PRIZM][queue] batch poll failed", {
          status: res.status,
          statusText: res.statusText,
          activeJobIds,
          errorBody,
        });
        return;
      }

      const data = (await res.json()) as {
        jobs: QueueJobPayload[];
        invalidJobIds?: string[];
      };

      if (Array.isArray(data.invalidJobIds) && data.invalidJobIds.length > 0) {
        console.warn("[PRIZM][queue] removing invalid job IDs from active queue", {
          invalidJobIds: data.invalidJobIds,
        });
        const invalidSet = new Set(data.invalidJobIds);
        setActiveJobIds((prev) => prev.filter((id) => !invalidSet.has(id)));
      }

      if (!Array.isArray(data.jobs) || data.jobs.length === 0) return;

      const completedOrFailedIds = new Set<string>();
      let newestCompleted: QueueJobPayload | null = null;

      for (const job of data.jobs) {
        if (job.status === "completed" || job.status === "failed") {
          completedOrFailedIds.add(job.id);
        }
        if (job.status === "completed" && job.resultUrl) {
          newestCompleted = job;
        }
      }

      if (newestCompleted?.resultUrl) {
        console.debug("[PRIZM][queue] newest completed job", {
          jobId: newestCompleted.id,
          type: newestCompleted.type,
        });
        setLatestResultUrl(newestCompleted.resultUrl);
        if (newestCompleted.type) setLatestResultType(newestCompleted.type);
      }

      setHistory((prev) => {
        const updates = new Map(data.jobs.map((job) => [job.id, job]));
        return prev.map((job) => {
          const update = updates.get(job.id);
          if (!update) return job;
          return {
            ...job,
            status: update.status,
            type: update.type ?? job.type,
            prompt: update.prompt ?? job.prompt,
            resultUrl: update.resultUrl,
            errorMessage: update.errorMessage,
            updatedAt: update.updatedAt ?? job.updatedAt,
          };
        });
      });

      if (completedOrFailedIds.size > 0) {
        console.debug("[PRIZM][queue] removing finished jobs from active list", {
          finishedCount: completedOrFailedIds.size,
        });
        setActiveJobIds((prev) => prev.filter((id) => !completedOrFailedIds.has(id)));
      }
    } catch (error) {
      console.error("[PRIZM][queue] poll threw error", error);
      // Keep polling loop resilient to transient network failures.
    }
  }, [activeJobIds]);

  useEffect(() => {
    if (activeJobIds.length === 0) return;

    const initialKickoff = setTimeout(() => {
      void pollQueueStatuses();
    }, 50);

    const hasProcessing = activeJobs.some((job) => job.status === "processing");
    const intervalMs = hasProcessing ? FAST_POLL_MS : SLOW_POLL_MS;
    console.debug("[PRIZM][queue] poll loop started", {
      activeJobs: activeJobIds.length,
      intervalMs,
    });
    const intervalId = setInterval(() => {
      void pollQueueStatuses();
    }, intervalMs);

    return () => {
      clearTimeout(initialKickoff);
      clearInterval(intervalId);
    };
  }, [activeJobIds.length, activeJobs, pollQueueStatuses]);

  return (
    <div style={{ flex: 1, display: "flex", height: "100%", overflow: "hidden", width: "100%" }}>
      {/* Center Stage */}
      <div style={{ flex: 1, position: "relative", display: "flex", flexDirection: "column", background: "#060606" }}>
        
        {/* Canvas / Latest Result Area */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", paddingBottom: "160px" }}>
          {!latestResultUrl && activeJobIds.length === 0 ? (
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
              onJobCreated={(jobId, prompt, type, modelId) => handleJobCreated(jobId, prompt, type, modelId)}
              onDirectResult={(res, prompt, type) => {
                console.debug("[PRIZM][generate] direct result received", {
                  jobId: res.jobId,
                  type,
                  model: res.apiInfo.model,
                });
                setLatestResultUrl(res.url);
                setLatestResultType(res.type);
                const newJob: GenerationJob = {
                  id: res.jobId ?? crypto.randomUUID(),
                  type: type,
                  status: "completed",
                  modelId: res.apiInfo.model,
                  prompt: prompt ?? "Direct Generation",
                  resultUrl: res.url,
                  errorMessage: null,
                  creditCost: 0,
                  createdAt: new Date().toISOString(),
                  generationTimeMs: res.apiInfo.generationTimeMs,
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
          {activeJobs.map((jobInfo) => {
            const id = jobInfo.id;
            const modelInfo = jobInfo?.modelId ? getModelInfo(jobInfo.modelId) : null;
            const isVideo = jobInfo?.type === "video";
            return (
              <div key={id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: "0.875rem", overflow: "hidden" }}>
                {/* Header row: model + type badge */}
                <div style={{ padding: "0.75rem 0.875rem", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  {modelInfo && (
                    <ModelBrandIcon model={modelInfo} active={false} />
                  )}
                  <span style={{ flex: 1, fontSize: "0.75rem", fontWeight: 600, color: "rgba(255,255,255,0.85)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {modelInfo?.displayName ?? "Generating..."}
                  </span>
                  <span style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: isVideo ? "#f59e0b" : VL, background: isVideo ? "rgba(245,158,11,0.1)" : "rgba(124,58,237,0.15)", borderRadius: "999px", padding: "2px 8px" }}>
                    {isVideo ? <FilmSlate size={10} aria-hidden /> : <ImageIcon size={10} aria-hidden />}
                    {isVideo ? "Video" : "Image"}
                  </span>
                </div>

                {/* Prompt */}
                {jobInfo && (
                  <div style={{ padding: "0.625rem 0.875rem 0 0.875rem" }}>
                    <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {jobInfo.prompt}
                    </p>
                  </div>
                )}

                {/* Status strip */}
                <div style={{ padding: "0.5rem 0.875rem 0.75rem 0.875rem" }}>
                  <QueueStatus
                    jobState={{
                      id,
                      status: jobInfo.status as QueueJobStatus,
                      resultUrl: jobInfo.resultUrl,
                      errorMessage: jobInfo.errorMessage,
                      prompt: jobInfo.prompt,
                      type: (jobInfo.type as "image" | "video") ?? null,
                    }}
                  />
                </div>
              </div>
            );
          })}

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {historyCardJobs.map((job) => (
              <HistoryCard
                key={job.id}
                job={job}
                onClick={() => {
                  if (job.resultUrl) {
                    setLatestResultUrl(job.resultUrl);
                    setLatestResultType(job.type);
                  }
                }}
                onUseSetup={(usedJob) => {
                  const el = document.getElementById("prompt") as HTMLTextAreaElement;
                  if (el) {
                    el.value = usedJob.prompt;
                    const e = new Event("input", { bubbles: true });
                    el.dispatchEvent(e);
                  }
                }}
              />
            ))}
            {history.length === 0 && activeJobIds.length === 0 && (
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


