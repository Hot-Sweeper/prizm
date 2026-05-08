import { GenerationCard } from "./generation-card";

interface Job {
  id: string;
  type: "image" | "video";
  status: "queued" | "processing" | "completed" | "failed";
  prompt: string;
  resultUrl: string | null;
  errorMessage: string | null;
  creditCost: number;
  createdAt: Date;
}

interface GalleryGridProps {
  jobs: Job[];
}

export function GalleryGrid({ jobs }: GalleryGridProps) {
  if (jobs.length === 0) {
    return (
      <p className="rounded-[1.6rem] border border-dashed border-neutral-800 bg-neutral-900/60 px-6 py-16 text-center text-sm leading-7 text-neutral-400">
        No generations yet. Create your first one!
      </p>
    );
  }

  return (
    <ul
      role="list"
      aria-label="Your generations"
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
    >
      {jobs.map((job) => (
        <li key={job.id} className="h-full">
          <GenerationCard {...job} />
        </li>
      ))}
    </ul>
  );
}

