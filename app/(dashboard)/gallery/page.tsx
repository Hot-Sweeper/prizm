import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUserJobs } from "@/lib/db/queries/jobs";
import { GalleryGrid } from "@/components/features/gallery/gallery-grid";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gallery — PRIZM",
  description: "Your AI-generated images and videos",
};

interface GalleryPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function GalleryPage({ searchParams }: GalleryPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page ?? "1", 10));

  const jobs = await getUserJobs(session.user.id, currentPage).catch(() => []);

  return (
    <main id="maincontent" tabIndex={-1} style={{ maxWidth: "1280px", margin: "0 auto", padding: "2rem 1.5rem", width: "100%", overflowY: "auto", height: "100%" }}>
      <h1 className="font-display" style={{ fontSize: "2rem", letterSpacing: "0.06em", color: "#fff", marginBottom: "1.75rem" }}>
        GALLERY
      </h1>
      <GalleryGrid jobs={jobs} />

      {jobs.length === 20 && (
        <nav aria-label="Gallery pagination" style={{ marginTop: "2rem", display: "flex", justifyContent: "center", gap: "1rem" }}>
          {currentPage > 1 && (
            <a href={`?page=${currentPage - 1}`} style={{ fontSize: "0.875rem", color: "var(--color-secondary)" }}>Previous</a>
          )}
          <a href={`?page=${currentPage + 1}`} style={{ fontSize: "0.875rem", color: "var(--color-secondary)" }}>Next</a>
        </nav>
      )}
    </main>
  );
}

