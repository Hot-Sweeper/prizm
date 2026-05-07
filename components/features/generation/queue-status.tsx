"use client";

import { XCircle, Clock, Spinner as Loader2 } from "@phosphor-icons/react/dist/ssr";

type JobStatus = "queued" | "processing" | "completed" | "failed";

interface JobState {
  id?: string;
  status: JobStatus;
  resultUrl: string | null;
  errorMessage: string | null;
  prompt: string | null;
  type: "image" | "video" | null;
}

interface QueueStatusProps {
  jobState: JobState;
}

export function QueueStatus({ jobState }: QueueStatusProps) {

  return (
    <div>
      {/* Screen reader live region for status changes */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {jobState.status === "queued" && "Your generation is queued"}
        {jobState.status === "processing" && "Your generation is processing"}
        {jobState.status === "completed" && "Your generation is complete"}
        {jobState.status === "failed" && `Generation failed: ${jobState.errorMessage}`}
      </div>

      {jobState.status === "queued" && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Clock size={13} aria-hidden="true" style={{ color: "#f59e0b", flexShrink: 0 }} />
          <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)" }}>Waiting in queue…</span>
        </div>
      )}

      {jobState.status === "processing" && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Loader2
            size={13}
            aria-hidden="true"
            style={{ color: "var(--color-secondary)", flexShrink: 0, animation: "spin 1s linear infinite" }}
          />
          <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)" }}>Generating with AI…</span>
        </div>
      )}

      {jobState.status === "completed" && jobState.resultUrl && null /* parent removes card on complete */}

      {jobState.status === "failed" && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <XCircle size={13} aria-hidden="true" style={{ color: "#ef4444", flexShrink: 0 }} />
          <span style={{ fontSize: "0.72rem", color: "#ef4444" }}>
            {jobState.errorMessage ?? "Generation failed"}
          </span>
        </div>
      )}
    </div>
  );
}


