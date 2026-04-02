"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { CheckCircle, XCircle, Clock, Spinner as Loader2 } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";

type JobStatus = "queued" | "processing" | "completed" | "failed";

interface QueueStatusProps {
  jobId: string;
  onComplete?: (resultUrl: string) => void;
}

interface JobState {
  status: JobStatus;
  resultUrl: string | null;
  errorMessage: string | null;
  prompt: string | null;
  type: "image" | "video" | null;
}

const POLL_INTERVAL_MS = 3000;

export function QueueStatus({ jobId, onComplete }: QueueStatusProps) {
  const [jobState, setJobState] = useState<JobState>({
    status: "queued",
    resultUrl: null,
    errorMessage: null,
    prompt: null,
    type: null,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/queue/${jobId}`);
      if (!res.ok) return;

      const data = (await res.json()) as JobState & { status: JobStatus };
      setJobState(data);

      if (data.status === "completed" || data.status === "failed") {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (data.status === "completed" && data.resultUrl && onComplete) {
          onComplete(data.resultUrl);
        }
      }
    } catch {
      // Silently ignore poll failures — will retry on next interval
    }
  }, [jobId, onComplete]);

  useEffect(() => {
    poll(); // Immediate first poll
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [poll]);

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
      {/* Screen reader live region for status changes */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {jobState.status === "queued" && "Your generation is queued"}
        {jobState.status === "processing" && "Your generation is processing"}
        {jobState.status === "completed" && "Your generation is complete"}
        {jobState.status === "failed" && `Generation failed: ${jobState.errorMessage}`}
      </div>

      {jobState.status === "queued" && (
        <div className="flex items-center gap-3 text-neutral-400">
          <Clock size={18} aria-hidden="true" className="text-amber-400" />
          <div>
            <p className="text-sm font-medium text-neutral-200">Queued</p>
            <p className="text-xs">Waiting for an available worker...</p>
          </div>
        </div>
      )}

      {jobState.status === "processing" && (
        <div className="flex items-center gap-3 text-neutral-400">
          <Loader2
            size={18}
            aria-hidden="true"
            className="text-brand-400"
            style={{ animation: "spin 1s linear infinite" }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div>
            <p className="text-sm font-medium text-neutral-200">Processing</p>
            <p className="text-xs">Generating with AI...</p>
          </div>
        </div>
      )}

      {jobState.status === "completed" && jobState.resultUrl && (
        <div>
          <div className="mb-3 flex items-center gap-2 text-green-400">
            <CheckCircle size={16} aria-hidden="true" />
            <span className="text-sm font-medium">Complete</span>
          </div>
          {jobState.type === "image" ? (
            <div className="relative aspect-square w-full overflow-hidden rounded-lg">
              <Image
                src={jobState.resultUrl}
                alt={jobState.prompt ?? "Generated image"}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 50vw"
              />
            </div>
          ) : (
            <video
              src={jobState.resultUrl}
              controls
              className="w-full rounded-lg"
              aria-label={`Generated video: ${jobState.prompt ?? ""}`}
            />
          )}
          <a
            href={jobState.resultUrl}
            download
            className="mt-3 inline-flex items-center gap-1 text-xs text-brand-400 hover:underline"
          >
            Download
          </a>
        </div>
      )}

      {jobState.status === "failed" && (
        <div className="flex items-start gap-3 text-red-400">
          <XCircle size={18} aria-hidden="true" className="mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium">Generation failed</p>
            <p className="text-xs text-neutral-500">
              {jobState.errorMessage ?? "An unknown error occurred"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}


