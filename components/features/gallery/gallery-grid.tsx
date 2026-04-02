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
      <p className="text-center text-sm text-neutral-500 py-12">
        No generations yet. Create your first one!
      </p>
    );
  }

  return (
    <ul
      role="list"
      aria-label="Your generations"
      className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
    >
      {jobs.map((job) => (
        <li key={job.id}>
          <GenerationCard {...job} />
        </li>
      ))}
    </ul>
  );
}

