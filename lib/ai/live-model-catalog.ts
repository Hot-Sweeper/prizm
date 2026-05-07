import "server-only";

import { getBrandIconUrl, inferFamilyKey, inferTransport, type ModelInfo } from "@/lib/ai/models";
import { buildDefaultSettings, getModelCapabilityProfile } from "@/lib/ai/model-capabilities";

type ModelTier = "free" | "pro" | "max";
type GenerationType = "image" | "video";

interface CometApiModelRecord {
  id: string;
  code?: string;
  provider?: string;
  provider_code?: string;
  name?: string;
  description?: string;
  model_type?: string;
  features?: string[] | null;
  pricing?: {
    per_request?: number | null;
    per_second?: number | null;
    input?: number | null;
    output?: number | null;
  } | null;
  endpoints?: string | Record<string, unknown> | unknown[] | null;
  api_doc_url?: string | null;
  latest_model_name?: string | null;
  published_at?: number | null;
  provider_sort?: number | null;
  model_sort?: number | null;
  upcoming?: boolean;
}

export interface LiveModelCatalogEntry extends ModelInfo {
  id: string;
  type: GenerationType;
  providerCode: string;
  features: string[];
  apiDocUrl: string | null;
  latestModelName: string | null;
  settingsDefaults: Record<string, unknown>;
}

interface LiveModelCatalog {
  imageModels: LiveModelCatalogEntry[];
  videoModels: LiveModelCatalogEntry[];
  byId: Record<string, LiveModelCatalogEntry>;
  fetchedAt: string;
}

const CATALOG_TTL_MS = 5 * 60 * 1000;

let catalogCache:
  | {
      expiresAt: number;
      value: LiveModelCatalog;
    }
  | undefined;

function parseEndpoints(value: CometApiModelRecord["endpoints"]) {
  if (!value) return [] as Array<{ key: string; path?: string; method?: string }>;
  const parsed = typeof value === "string" ? safeJsonParse(value) ?? value : value;

  if (Array.isArray(parsed)) {
    return parsed
      .map((entry, index) => {
        if (typeof entry === "string") {
          return { key: `${index}`, path: entry };
        }
        if (entry && typeof entry === "object") {
          const objectEntry = entry as Record<string, unknown>;
          return {
            key: String(objectEntry.key ?? index),
            path: typeof objectEntry.path === "string" ? objectEntry.path : undefined,
            method: typeof objectEntry.method === "string" ? objectEntry.method : undefined,
          };
        }
        return null;
      })
      .filter(Boolean) as Array<{ key: string; path?: string; method?: string }>;
  }

  if (parsed && typeof parsed === "object") {
    return Object.entries(parsed as Record<string, unknown>).map(([key, entry]) => {
      if (typeof entry === "string") {
        const reparsed = safeJsonParse(entry);
        if (reparsed && typeof reparsed === "object") {
          const objectEntry = reparsed as Record<string, unknown>;
          return {
            key,
            path: typeof objectEntry.path === "string" ? objectEntry.path : undefined,
            method: typeof objectEntry.method === "string" ? objectEntry.method : undefined,
          };
        }

        return { key, path: entry };
      }

      if (entry && typeof entry === "object") {
        const objectEntry = entry as Record<string, unknown>;
        return {
          key,
          path: typeof objectEntry.path === "string" ? objectEntry.path : undefined,
          method: typeof objectEntry.method === "string" ? objectEntry.method : undefined,
        };
      }

      return { key };
    });
  }

  return [] as Array<{ key: string; path?: string; method?: string }>;
}

function buildEndpointTokens(endpoints: Array<{ key: string; path?: string; method?: string }>) {
  const tokens = new Set<string>();
  for (const endpoint of endpoints) {
    const key = endpoint.key?.trim().toLowerCase();
    const path = endpoint.path?.trim().toLowerCase();
    if (key) tokens.add(key);
    if (path) tokens.add(path);
  }
  return tokens;
}

function safeJsonParse(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function looksLikeImageModel(model: CometApiModelRecord) {
  const haystack = `${model.id} ${model.name ?? ""}`.toLowerCase();
  return [
    "image",
    "dall-e",
    "gpt-image",
    "gemini",
    "nano banana",
    "seedream",
    "flux",
    "ideogram",
    "recraft",
    "stable-diffusion",
    "sdxl",
    "midjourney",
    "bria",
  ].some((keyword) => haystack.includes(keyword));
}

function looksLikeVideoModel(model: CometApiModelRecord) {
  const haystack = `${model.id} ${model.name ?? ""}`.toLowerCase();
  return ["video", "sora", "veo", "kling", "runway", "seedance", "luma", "wan", "minimax"].some((keyword) => haystack.includes(keyword));
}

function detectGenerationType(model: CometApiModelRecord, endpointTokens: Set<string>): GenerationType | null {
  const explicitType = (model.model_type ?? "").trim().toLowerCase();
  if (explicitType) {
    if (explicitType === "image" || explicitType === "video") {
      return explicitType;
    }

    // Explicit non-image/video type from provider should not be coerced.
    return null;
  }

  if (model.features?.includes("text-to-image") || model.features?.includes("image-editing") || model.features?.includes("image-to-image")) {
    return "image";
  }

  if (model.features?.includes("text-to-video") || model.features?.includes("image-to-video") || model.features?.includes("video-editing")) {
    return "video";
  }

  // Fallback to endpoint aliases used by Comet when type/features are omitted.
  if (
    (endpointTokens.has("openai") || endpointTokens.has("image-generation") || endpointTokens.has("/v1/images/generations")) &&
    looksLikeImageModel(model)
  ) {
    return "image";
  }

  if ((endpointTokens.has("video-generation") || endpointTokens.has("/v1/videos")) && looksLikeVideoModel(model)) {
    return "video";
  }

  return null;
}

function isSupportedRecord(type: GenerationType, endpointTokens: Set<string>) {
  if (type === "image") {
    // Currently implemented image execution supports OpenAI-style and Gemini-style transports.
    return (
      endpointTokens.has("openai") ||
      endpointTokens.has("image-generation") ||
      endpointTokens.has("/v1/images/generations") ||
      endpointTokens.has("/v1beta/models/{model}:generatecontent")
    );
  }

  return endpointTokens.has("video-generation") || endpointTokens.has("/v1/videos");
}

function estimateCostUSD(model: CometApiModelRecord, type: GenerationType) {
  const perRequest = model.pricing?.per_request ?? null;
  if (typeof perRequest === "number" && perRequest > 0) return perRequest;

  const perSecond = model.pricing?.per_second ?? null;
  if (typeof perSecond === "number" && perSecond > 0) {
    return perSecond * (type === "video" ? 5 : 1);
  }

  if (type === "image") {
    return 0.04;
  }

  return 0.25;
}

function deriveTier(estimatedCostUSD: number, type: GenerationType): ModelTier {
  if (type === "image") {
    if (estimatedCostUSD <= 0.035) return "free";
    if (estimatedCostUSD <= 0.1) return "pro";
    return "max";
  }

  if (estimatedCostUSD <= 0.35) return "pro";
  return "max";
}

function deriveCreditCost(estimatedCostUSD: number, type: GenerationType) {
  if (type === "image") {
    if (estimatedCostUSD <= 0.02) return 1;
    if (estimatedCostUSD <= 0.06) return 2;
    if (estimatedCostUSD <= 0.12) return 3;
    return 4;
  }

  if (estimatedCostUSD <= 0.12) return 3;
  if (estimatedCostUSD <= 0.3) return 5;
  if (estimatedCostUSD <= 0.6) return 7;
  return 9;
}

function formatPricingLabel(model: CometApiModelRecord, estimatedCostUSD: number, type: GenerationType) {
  if (typeof model.pricing?.per_second === "number" && model.pricing.per_second > 0) {
    return `$${model.pricing.per_second.toFixed(3)} / sec`;
  }

  if (typeof model.pricing?.per_request === "number" && model.pricing.per_request > 0) {
    return `Est. $${model.pricing.per_request.toFixed(3)} / req`;
  }

  return type === "image"
    ? `Est. $${estimatedCostUSD.toFixed(3)} / req`
    : `Est. $${estimatedCostUSD.toFixed(3)} / 5s`;
}

function titleCaseSegment(segment: string) {
  if (!segment) return "";
  if (/^\d/.test(segment)) return segment.toUpperCase();
  return segment.charAt(0).toUpperCase() + segment.slice(1);
}

function prettifyModelId(modelId: string) {
  const trailing = modelId.split("/").pop() ?? modelId;
  return trailing
    .replace(/[._]/g, "-")
    .split("-")
    .filter(Boolean)
    .map(titleCaseSegment)
    .join(" ");
}

function resolveDisplayName(model: CometApiModelRecord) {
  const preferred = model.name?.trim();
  if (preferred && preferred.toLowerCase() !== model.id.toLowerCase()) {
    return preferred;
  }

  const latest = model.latest_model_name?.trim();
  if (latest && latest.toLowerCase() !== model.id.toLowerCase()) {
    return latest;
  }

  return prettifyModelId(model.id);
}

function normalizeRecord(model: CometApiModelRecord): LiveModelCatalogEntry | null {
  const endpoints = parseEndpoints(model.endpoints);
  const endpointTokens = buildEndpointTokens(endpoints);
  const type = detectGenerationType(model, endpointTokens);
  if (!type || model.upcoming) return null;
  if (!isSupportedRecord(type, endpointTokens)) return null;

  const estimatedCostUSD = estimateCostUSD(model, type);
  const provider = model.provider ?? "CometAPI";
  const providerCode = (model.provider_code ?? provider).toLowerCase();
  const familyKey = inferFamilyKey(model.id);
  // Prefer the explicit provider code from Comet catalog over model-id inference for icons
  const brandIconUrl =
    getBrandIconUrl(providerCode) ??
    getBrandIconUrl(provider.toLowerCase()) ??
    getBrandIconUrl(familyKey);
  const transport = inferTransport(model.id, type);
  const baseInfo: LiveModelCatalogEntry = {
    id: model.id,
    displayName: resolveDisplayName(model),
    provider,
    providerCode,
    familyKey,
    creditCost: deriveCreditCost(estimatedCostUSD, type),
    minTier: deriveTier(estimatedCostUSD, type),
    description: model.description?.trim() || `${provider} ${type} model available through CometAPI.`,
    estimatedCostUSD,
    pricingLabel: formatPricingLabel(model, estimatedCostUSD, type),
    transport,
    type,
    features: model.features ?? [],
    apiDocUrl: model.api_doc_url ?? null,
    latestModelName: model.latest_model_name ?? null,
    brandIconUrl: brandIconUrl ?? undefined,
    iconUrl: brandIconUrl ?? undefined,
    settingsDefaults: {},
  };

  const profile = getModelCapabilityProfile(baseInfo);
  return {
    ...baseInfo,
    settingsDefaults: buildDefaultSettings(profile),
  };
}

function sortModels(a: LiveModelCatalogEntry, b: LiveModelCatalogEntry) {
  return a.provider.localeCompare(b.provider) || a.displayName.localeCompare(b.displayName);
}

async function fetchLiveModelCatalogUncached(): Promise<LiveModelCatalog> {
  const response = await fetch("https://api.cometapi.com/api/models", {
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch CometAPI catalog (${response.status})`);
  }

  const payload = (await response.json()) as { data?: CometApiModelRecord[] };
  const normalized = (payload.data ?? [])
    .map(normalizeRecord)
    .filter((entry): entry is LiveModelCatalogEntry => Boolean(entry));

  const imageModels = normalized.filter((entry) => entry.type === "image").sort(sortModels);
  const videoModels = normalized.filter((entry) => entry.type === "video").sort(sortModels);
  const byId = Object.fromEntries(normalized.map((entry) => [entry.id, entry]));

  return {
    imageModels,
    videoModels,
    byId,
    fetchedAt: new Date().toISOString(),
  };
}

export async function getLiveModelCatalog() {
  const now = Date.now();
  if (catalogCache && catalogCache.expiresAt > now) {
    return catalogCache.value;
  }

  const value = await fetchLiveModelCatalogUncached();
  catalogCache = {
    value,
    expiresAt: now + CATALOG_TTL_MS,
  };
  return value;
}

export async function getLiveModelById(modelId: string) {
  const catalog = await getLiveModelCatalog();
  return catalog.byId[modelId] ?? null;
}