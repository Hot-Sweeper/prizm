import Image from "next/image";
import { DownloadSimple as Download, Image as ImageIcon, VideoCamera as VideoIcon, WarningCircle as AlertCircle, Clock, Spinner as Loader2, CheckCircle } from "@phosphor-icons/react/dist/ssr";
import { Badge } from "@/components/ui/badge";

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

const statusConfig = {
  queued: { label: "Queued", variant: "warning" as const, icon: Clock },
  processing: { label: "Processing", variant: "default" as const, icon: Loader2 },
  completed: { label: "Done", variant: "success" as const, icon: CheckCircle },
  failed: { label: "Failed", variant: "danger" as const, icon: AlertCircle },
};

export function GenerationCard({
  id,
  type,
  status,
  prompt,
  resultUrl,
  errorMessage,
  creditCost,
  createdAt,
}: GenerationCardProps) {
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <article
      aria-label={`${type} generation: ${prompt.slice(0, 50)}`}
      className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900"
    >
      {/* Thumbnail */}
      <div className="relative aspect-square bg-neutral-800">
        {status === "completed" && resultUrl ? (
          type === "image" ? (
            <Image
              src={resultUrl}
              alt={prompt}
              fill
              className="object-cover"
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
          )
        ) : (
          <div className="flex h-full items-center justify-center">
            {type === "image" ? (
              <ImageIcon size={32} aria-hidden="true" className="text-neutral-700" />
            ) : (
              <VideoIcon size={32} aria-hidden="true" className="text-neutral-700" />
            )}
          </div>
        )}

        {/* Status badge overlay */}
        <div className="absolute left-2 top-2">
          <Badge variant={config.variant}>
            <StatusIcon size={10} aria-hidden="true" />
            {config.label}
          </Badge>
        </div>
      </div>

      {/* Card body */}
      <div className="p-3">
        <p
          className="mb-2 line-clamp-2 text-xs leading-relaxed text-neutral-300"
          title={prompt}
        >
          {prompt}
        </p>

        <div className="flex items-center justify-between">
          <time
            dateTime={createdAt.toISOString()}
            className="text-xs text-neutral-500"
          >
            {new Date(createdAt).toLocaleDateString()}
          </time>
          <span className="text-xs text-neutral-500">{creditCost}cr</span>
        </div>

        {status === "failed" && errorMessage && (
          <p className="mt-2 text-xs text-red-400" role="alert">
            {errorMessage}
          </p>
        )}

        {status === "completed" && resultUrl && (
          <a
            href={resultUrl}
            download
            className="mt-2 inline-flex items-center gap-1 text-xs text-brand-400 hover:underline"
            aria-label={`Download ${type}`}
          >
            <Download size={12} aria-hidden="true" />
            Download
          </a>
        )}
      </div>
    </article>
  );
}


