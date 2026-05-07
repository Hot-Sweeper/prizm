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
    <main id="maincontent" tabIndex={-1} style={{ maxWidth: "1280px", margin: "0 auto", padding: "2rem 1.5rem", width: "100%", overflowY: "auto", height: "100%" }}>
      <h1 className="font-display" style={{ fontSize: "2rem", letterSpacing: "0.06em", color: "#fff", marginBottom: "1.75rem" }}>
        GALLERY
      </h1>

      {loading ? (
        <p className="text-center text-sm text-neutral-500 py-12">Loading gallery...</p>
      ) : (
        <GalleryGrid jobs={normalized} />
      )}
    </main>
  );
}
