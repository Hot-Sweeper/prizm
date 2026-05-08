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

function formatErrorMessage(errorMessage: string | null) {
  if (!errorMessage) return null;

  const condensed = errorMessage
    .replace(/\([^)]*request_id[^)]*\)/gi, "")
    .replace(/request id[:\s-]*[\w-]+/gi, "")
    .replace(/provider[:\s-]*[^,;]+/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  if (/fetch failed/i.test(condensed)) {
    return "We could not reach the provider for this generation.";
  }

  if (/5\d\d/.test(condensed)) {
    return "The provider returned a temporary server error.";
  }

  return condensed;
}

function formatPrompt(prompt: string) {
  return prompt.trim() || "Untitled generation";
}

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
  const formattedPrompt = formatPrompt(prompt);
  const formattedError = formatErrorMessage(errorMessage);
  const completedResultUrl = status === "completed" ? resultUrl ?? undefined : undefined;
  const isPending = status === "queued" || status === "processing";
  const isCompleted = Boolean(completedResultUrl);
  const TypeIcon = type === "image" ? ImageIcon : VideoIcon;

  return (
    <article
      aria-label={`${type} generation: ${formattedPrompt.slice(0, 50)}`}
      className="group flex h-full flex-col overflow-hidden rounded-[1.4rem] border border-neutral-800 bg-neutral-900/95 shadow-[0_20px_60px_rgba(0,0,0,0.28)] transition-transform duration-200 hover:-translate-y-1 hover:border-neutral-700"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-neutral-950">
        {completedResultUrl ? (
          type === "image" ? (
            <Image
              src={completedResultUrl}
              alt={formattedPrompt}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <video
              src={completedResultUrl}
              className="h-full w-full object-cover"
              muted
              playsInline
              aria-label={`Generated video: ${formattedPrompt}`}
            />
          )
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 bg-[radial-gradient(circle_at_top,_var(--color-neutral-800),_var(--color-neutral-950)_70%)] px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-neutral-700 bg-neutral-900/90 text-neutral-200 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
              <TypeIcon size={28} aria-hidden="true" className={isPending ? "animate-spin" : ""} />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-neutral-100">
                {isPending ? "Generation in progress" : "No preview available"}
              </p>
              <p className="line-clamp-3 text-sm leading-6 text-neutral-400">
                {isPending ? formattedPrompt : formattedError ?? formattedPrompt}
              </p>
            </div>
          </div>
        )}

        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
          <Badge variant={config.variant} className="backdrop-blur-sm">
            <StatusIcon size={10} aria-hidden="true" />
            {config.label}
          </Badge>
          <Badge variant="muted" className="border border-neutral-700/80 bg-neutral-950/80 text-neutral-200 backdrop-blur-sm">
            <TypeIcon size={10} aria-hidden="true" />
            {type}
          </Badge>
        </div>

        {isCompleted ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent" />
        ) : null}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3">
          <div className="rounded-2xl border border-neutral-800/80 bg-neutral-950/72 px-3 py-2 backdrop-blur-md">
            <p className="line-clamp-2 text-sm font-medium leading-5 text-neutral-50" title={formattedPrompt}>
              {formattedPrompt}
            </p>
            <div className="mt-2 flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.18em] text-neutral-400">
              <time dateTime={createdAt.toISOString()}>
                {new Date(createdAt).toLocaleDateString()}
              </time>
              <span>{creditCost} credits</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 border-t border-neutral-800 px-4 py-4">
        {status === "failed" && formattedError ? (
          <p className="rounded-2xl border border-red-950 bg-red-950/20 px-3 py-2 text-sm leading-6 text-red-200" role="alert" title={errorMessage ?? undefined}>
            {formattedError}
          </p>
        ) : (
          <p className="text-sm leading-6 text-neutral-400">
            {isPending
              ? "This job will appear here automatically when the provider finishes it."
              : type === "video"
                ? "Open or download the render once you are ready to publish it."
                : "Ready to download and reuse anywhere you need it."}
          </p>
        )}

        {completedResultUrl ? (
          <a
            href={completedResultUrl}
            download
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-neutral-700 bg-neutral-950 px-4 text-sm font-medium text-neutral-50 transition-colors hover:border-brand-400 hover:text-brand-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
            aria-label={`Download ${type} generation ${id}`}
          >
            <Download size={14} aria-hidden="true" />
            Download asset
          </a>
        ) : null}
      </div>
    </article>
  );
}


