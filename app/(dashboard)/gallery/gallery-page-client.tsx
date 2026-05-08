"use client";

import { useEffect, useState } from "react";
import { GalleryGrid } from "@/components/features/gallery/gallery-grid";

type GalleryJob = {
  id: string;
  type: "image" | "video";
  status: "queued" | "processing" | "completed" | "failed";
  prompt: string;
  resultUrl: string | null;
  errorMessage: string | null;
  creditCost: number;
  createdAt: string;
};

const FETCH_TIMEOUT_MS = 8000;

function createTimeoutSignal(timeoutMs: number) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  return { signal: controller.signal, clear: () => clearTimeout(timeoutId) };
}

export function GalleryPageClient() {
  const [jobs, setJobs] = useState<GalleryJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadGallery() {
      const timeout = createTimeoutSignal(FETCH_TIMEOUT_MS);
      try {
        const response = await fetch("/api/gallery?page=1", {
          cache: "no-store",
          credentials: "include",
          signal: timeout.signal,
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as { jobs?: GalleryJob[] };
        if (!cancelled && Array.isArray(data.jobs)) {
          setJobs(data.jobs);
        }
      } catch (error) {
        if (!cancelled && !(error instanceof DOMException && error.name === "AbortError")) {
          console.error("gallery fetch failed", error);
        }
      } finally {
        timeout.clear();
        if (!cancelled) setLoading(false);
      }
    }

    void loadGallery();

    return () => {
      cancelled = true;
    };
  }, []);

  const normalized = jobs.map((job) => ({
    ...job,
    createdAt: new Date(job.createdAt),
  }));

  return (
    <main id="maincontent" tabIndex={-1} className="mx-auto flex h-full w-full max-w-[1400px] flex-col gap-8 overflow-y-auto px-6 py-8 lg:px-10">
      <header className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-[0.28em] text-neutral-500">
          Creative archive
        </p>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <h1 className="font-display text-4xl tracking-[0.08em] text-neutral-50 sm:text-5xl">
              Gallery
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-neutral-400 sm:text-base">
              Every render lands here with its status, credits used, and a clean download action when it is ready.
            </p>
          </div>
          <div className="rounded-full border border-neutral-800 bg-neutral-900/80 px-4 py-2 text-sm text-neutral-300">
            {normalized.length} {normalized.length === 1 ? "asset" : "assets"}
          </div>
        </div>
      </header>

      {loading ? (
        <p className="rounded-[1.6rem] border border-neutral-800 bg-neutral-900/60 px-6 py-16 text-center text-sm leading-7 text-neutral-400">
          Loading gallery...
        </p>
      ) : (
        <GalleryGrid jobs={normalized} />
      )}
    </main>
  );
}
