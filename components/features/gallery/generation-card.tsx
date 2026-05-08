import Image from "next/image";
import {
  DownloadSimple,
  Image as ImageIcon,
  VideoCamera as VideoIcon,
  WarningCircle,
  Clock,
  Spinner,
  CheckCircle,
} from "@phosphor-icons/react/dist/ssr";

interface GenerationCardProps {
  id: string;
  type: "image" | "video";
  status: "queued" | "processing" | "completed" | "failed";
  prompt: string;
  resultUrl: string | null;
  errorMessage: string | null;
  creditCost: number;
  createdAt: Date;
}

const STATUS_CONFIG = {
  queued: {
    label: "Queued",
    Icon: Clock,
    spin: false,
    badgeClass: "bg-amber-950/80 border-amber-800/60 text-amber-300",
  },
  processing: {
    label: "Processing",
    Icon: Spinner,
    spin: true,
    badgeClass: "bg-neutral-950/80 border-neutral-600/60 text-neutral-200",
  },
  completed: {
    label: "Done",
    Icon: CheckCircle,
    spin: false,
    badgeClass: "bg-green-950/80 border-green-800/60 text-green-300",
  },
  failed: {
    label: "Failed",
    Icon: WarningCircle,
    spin: false,
    badgeClass: "bg-red-950/80 border-red-800/60 text-red-300",
  },
} as const;

export function GenerationCard({
  type,
  status,
  prompt,
  resultUrl,
  errorMessage,
  creditCost,
  createdAt,
}: GenerationCardProps) {
  const cfg = STATUS_CONFIG[status];
  const StatusIcon = cfg.Icon;

  return (
    <article
      aria-label={`${type} generation: ${prompt.slice(0, 50)}`}
      className="group overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 transition-all duration-300 hover:-translate-y-0.5 hover:border-neutral-700 hover:shadow-xl hover:shadow-black/50"
    >
      {/* Thumbnail */}
      <div className="relative aspect-square overflow-hidden bg-neutral-800">
        {status === "completed" && resultUrl ? (
          <>
            {type === "image" ? (
              <Image
                src={resultUrl}
                alt={prompt}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            ) : (
              <video
                src={resultUrl}
                className="h-full w-full object-cover"
                muted
                playsInline
                aria-label={`Generated video: ${prompt}`}
              />
            )}

            {/* Download overlay — revealed on hover */}
            <a
              href={resultUrl}
              download
              aria-label={`Download ${type}`}
              className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-300 group-hover:bg-black/55 group-hover:opacity-100"
            >
              <span className="flex h-12 w-12 scale-75 items-center justify-center rounded-full border border-white/25 bg-white/10 backdrop-blur-sm transition-transform duration-300 group-hover:scale-100">
                <DownloadSimple size={22} weight="bold" className="text-white" aria-hidden="true" />
              </span>
            </a>
          </>
        ) : (
          <div
            className={`flex h-full items-center justify-center${
              status === "failed" ? " bg-red-950/25" : ""
            }`}
          >
            {type === "image" ? (
              <ImageIcon
                size={40}
                aria-hidden="true"
                className={status === "failed" ? "text-red-900" : "text-neutral-700"}
              />
            ) : (
              <VideoIcon
                size={40}
                aria-hidden="true"
                className={status === "failed" ? "text-red-900" : "text-neutral-700"}
              />
            )}
          </div>
        )}

        {/* Status badge */}
        <div className="absolute left-2.5 top-2.5">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm ${cfg.badgeClass}`}
          >
            <StatusIcon
              size={11}
              aria-hidden="true"
              className={cfg.spin ? "animate-spin" : ""}
            />
            {cfg.label}
          </span>
        </div>
      </div>

      {/* Card body */}
      <div className="p-3.5">
        <p
          className="mb-3 line-clamp-2 text-sm leading-relaxed text-neutral-300"
          title={prompt}
        >
          {prompt}
        </p>

        <div className="flex items-center justify-between text-xs text-neutral-500">
          <time dateTime={createdAt.toISOString()}>
            {createdAt.toLocaleDateString()}
          </time>
          <span>{creditCost}cr</span>
        </div>

        {status === "failed" && errorMessage && (
          <p
            role="alert"
            className="mt-2.5 line-clamp-3 rounded-lg border border-red-900/40 bg-red-950/30 px-2.5 py-2 text-xs leading-relaxed text-red-400"
          >
            {errorMessage}
          </p>
        )}
      </div>
    </article>
  );
}



