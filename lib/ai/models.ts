export interface ModelInfo {
  id?: string;
  displayName: string;
  provider: string;
  familyKey:
    | "openai"
    | "google"
    | "doubao"
    | "replicate"
    | "bria"
    | "qwen"
    | "xai"
    | "flux"
    | "ideogram"
    | "recraft"
    | "stability"
    | "kling"
    | "luma"
    | "runway"
    | "minimax"
    | "wan";
  creditCost: number;
  minTier: "free" | "pro" | "max";
  description: string;
  estimatedCostUSD: number;
  pricingLabel: string;
  transport?: "openai-image" | "gemini-image" | "video-generate";
  directOnly?: boolean;
  iconUrl?: string;
  brandIconUrl?: string;
}

const THE_SVG_CDN_BASE = "https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons";

const PROVIDER_ICON_SLUGS: Record<string, string> = {
  openai: "openai",
  google: "google",
  doubao: "doubao",
  flux: "flux",
  runway: "runway",
  kling: "kling",
  minimax: "minimax",
  replicate: "replicate",
};

function titleCaseSegment(segment: string) {
  if (!segment) return "";
  if (/^[a-z]\d/i.test(segment) || /^\d/.test(segment)) return segment.toUpperCase();
  return segment.charAt(0).toUpperCase() + segment.slice(1);
}

function humanizeModelId(modelId: string) {
  return modelId
    .replace(/[._]/g, "-")
    .split("/")
    .flatMap((part) => part.split("-"))
    .filter(Boolean)
    .map(titleCaseSegment)
    .join(" ");
}

export function inferProvider(modelId: string): string {
  const normalized = modelId.toLowerCase();

  if (normalized.includes("gemini") || normalized.startsWith("veo")) return "Google";
  if (normalized.startsWith("gpt") || normalized.startsWith("dall-e") || normalized.startsWith("sora")) return "OpenAI";
  if (normalized.includes("seedance") || normalized.includes("seedream") || normalized.startsWith("doubao")) return "Doubao";
  if (normalized.includes("kling")) return "Kling";
  if (normalized.includes("runway")) return "Runway";
  if (normalized.includes("flux")) return normalized.includes("black-forest-labs") ? "Replicate" : "Flux";
  if (normalized.includes("recraft")) return "Replicate";
  if (normalized.includes("ideogram")) return "Replicate";
  if (normalized.includes("stable-diffusion") || normalized.includes("stability")) return "Replicate";
  if (normalized.includes("minimax")) return "MiniMax";
  if (normalized.includes("qwen")) return "Aliyun";
  if (normalized.includes("bria")) return "Bria";
  if (normalized.includes("luma")) return "Luma";
  if (normalized.includes("wan")) return "Wan";

  return "CometAPI";
}

export function inferFamilyKey(modelId: string): ModelInfo["familyKey"] {
  const normalized = modelId.toLowerCase();

  if (normalized.includes("gemini") || normalized.startsWith("veo")) return "google";
  if (normalized.startsWith("gpt") || normalized.startsWith("dall-e") || normalized.startsWith("sora")) return "openai";
  if (normalized.includes("seedance") || normalized.includes("seedream") || normalized.startsWith("doubao")) return "doubao";
  if (normalized.includes("kling")) return "kling";
  if (normalized.includes("runway")) return "runway";
  if (normalized.includes("flux")) return normalized.includes("black-forest-labs") ? "replicate" : "flux";
  if (normalized.includes("recraft")) return "recraft";
  if (normalized.includes("ideogram")) return "ideogram";
  if (normalized.includes("stable-diffusion") || normalized.includes("stability")) return "stability";
  if (normalized.includes("minimax")) return "minimax";
  if (normalized.includes("qwen")) return "qwen";
  if (normalized.includes("bria")) return "bria";
  if (normalized.includes("luma")) return "luma";
  if (normalized.includes("wan")) return "wan";

  return "openai";
}

export function inferTransport(modelId: string, typeHint?: "image" | "video"): ModelInfo["transport"] {
  const normalized = modelId.toLowerCase();

  if (normalized.includes("gemini") && (typeHint === "image" || normalized.includes("image"))) {
    return "gemini-image";
  }

  if (typeHint === "video" || normalized.startsWith("sora") || normalized.startsWith("veo") || normalized.includes("seedance") || normalized.includes("kling") || normalized.includes("runway")) {
    return "video-generate";
  }

  return "openai-image";
}

export function getBrandIconUrl(providerOrCode: string) {
  const normalized = providerOrCode.toLowerCase().replace(/\s+/g, "-");
  const slug = PROVIDER_ICON_SLUGS[normalized];
  return slug ? `${THE_SVG_CDN_BASE}/${slug}/default.svg` : null;
}

function inferModelInfo(modelId: string): ModelInfo {
  const provider = inferProvider(modelId);
  const familyKey = inferFamilyKey(modelId);
  const isVideo = modelId.toLowerCase().startsWith("sora") || modelId.toLowerCase().startsWith("veo") || modelId.toLowerCase().includes("seedance") || modelId.toLowerCase().includes("video");
  const estimatedCostUSD = isVideo ? 0.25 : 0.04;
  const creditCost = isVideo ? 5 : 2;
  const minTier = isVideo ? "pro" : "free";
  const transport = inferTransport(modelId, isVideo ? "video" : "image");
  const brandIconUrl = getBrandIconUrl(provider) ?? getBrandIconUrl(familyKey);

  return {
    id: modelId,
    displayName: humanizeModelId(modelId),
    provider,
    familyKey,
    creditCost,
    minTier,
    description: `${provider} model available through CometAPI.`,
    estimatedCostUSD,
    pricingLabel: estimatedCostUSD ? `Est. $${estimatedCostUSD.toFixed(3)} / req` : "Live pricing",
    transport,
    brandIconUrl: brandIconUrl ?? undefined,
    iconUrl: brandIconUrl ?? undefined,
  };
}

export const IMAGE_MODELS: Record<string, ModelInfo> = {
  // ── OpenAI ──────────────────────────────────────────
  "dall-e-2": { displayName: "DALL-E 2", provider: "OpenAI", familyKey: "openai", creditCost: 1, minTier: "free", description: "Classic image generation", estimatedCostUSD: 0.02, pricingLabel: "Est. $0.020 / req", transport: "openai-image" },
  "dall-e-3": { displayName: "DALL-E 3", provider: "OpenAI", familyKey: "openai", creditCost: 1, minTier: "free", description: "Fast, versatile image generation", estimatedCostUSD: 0.04, pricingLabel: "Est. $0.040 / req", transport: "openai-image" },
  "gpt-image-1": { displayName: "GPT Image", provider: "OpenAI", familyKey: "openai", creditCost: 2, minTier: "pro", description: "Most advanced image model", estimatedCostUSD: 0.07, pricingLabel: "Est. $0.070 / req", transport: "openai-image" },
  "gpt-image-1-mini": { displayName: "GPT Image Mini", provider: "OpenAI", familyKey: "openai", creditCost: 1, minTier: "free", description: "Fast, affordable GPT images", estimatedCostUSD: 0.02, pricingLabel: "Est. $0.020 / req", transport: "openai-image" },
  "gpt-image-1.5": { displayName: "GPT Image 1.5", provider: "OpenAI", familyKey: "openai", creditCost: 2, minTier: "pro", description: "Enhanced GPT image generation", estimatedCostUSD: 0.08, pricingLabel: "Est. $0.080 / req", transport: "openai-image" },
  // ── Google / Gemini ─────────────────────────────────
  "gemini-3-pro-image": { displayName: "Nano Banana Pro", provider: "Google", familyKey: "google", creditCost: 3, minTier: "max", description: "Gemini image stack with extreme definition", estimatedCostUSD: 0.03, pricingLabel: "$0.40/M in • $2.40/M out", transport: "gemini-image", directOnly: true },
  "gemini-3.1-flash-image-preview": { displayName: "Nano Banana 2", provider: "Google", familyKey: "google", creditCost: 1, minTier: "pro", description: "Gemini standard generation", estimatedCostUSD: 0.015, pricingLabel: "Fast", transport: "gemini-image", directOnly: true },
  // ── Flux (Black Forest Labs) ────────────────────────
  "flux-schnell": { displayName: "Flux Schnell", provider: "Flux", familyKey: "flux", creditCost: 1, minTier: "free", description: "Fastest Flux model, great for drafts", estimatedCostUSD: 0.003, pricingLabel: "Est. $0.003 / req", transport: "openai-image" },
  "flux-dev": { displayName: "Flux Dev", provider: "Flux", familyKey: "flux", creditCost: 1, minTier: "pro", description: "Open-source development model", estimatedCostUSD: 0.025, pricingLabel: "Est. $0.025 / req", transport: "openai-image" },
  "flux-pro-1.1": { displayName: "Flux Pro 1.1", provider: "Flux", familyKey: "flux", creditCost: 2, minTier: "pro", description: "Production-quality generation", estimatedCostUSD: 0.04, pricingLabel: "Est. $0.040 / req", transport: "openai-image" },
  "flux-pro-1.1-ultra": { displayName: "Flux Pro Ultra", provider: "Flux", familyKey: "flux", creditCost: 3, minTier: "max", description: "Highest-quality Flux output", estimatedCostUSD: 0.06, pricingLabel: "Est. $0.060 / req", transport: "openai-image" },
  "flux-2-pro": { displayName: "Flux 2 Pro", provider: "Flux", familyKey: "flux", creditCost: 3, minTier: "max", description: "Latest Flux 2 production model", estimatedCostUSD: 0.05, pricingLabel: "Est. $0.050 / req", transport: "openai-image" },
  "flux-2-max": { displayName: "Flux 2 Max", provider: "Flux", familyKey: "flux", creditCost: 4, minTier: "max", description: "Maximum quality Flux 2", estimatedCostUSD: 0.07, pricingLabel: "Est. $0.070 / req", transport: "openai-image" },
  "flux-kontext-pro": { displayName: "Flux Kontext Pro", provider: "Flux", familyKey: "flux", creditCost: 2, minTier: "pro", description: "Context-aware editing model", estimatedCostUSD: 0.04, pricingLabel: "Est. $0.040 / req", transport: "openai-image" },
  "flux-kontext-max": { displayName: "Flux Kontext Max", provider: "Flux", familyKey: "flux", creditCost: 3, minTier: "max", description: "Maximum quality context editing", estimatedCostUSD: 0.06, pricingLabel: "Est. $0.060 / req", transport: "openai-image" },
  // ── Ideogram ────────────────────────────────────────
  "ideogram-ai/ideogram-v3-turbo": { displayName: "Ideogram V3 Turbo", provider: "Ideogram", familyKey: "ideogram", creditCost: 2, minTier: "pro", description: "Fast ideogram generation", estimatedCostUSD: 0.04, pricingLabel: "Est. $0.040 / req", transport: "openai-image" },
  "ideogram-ai/ideogram-v3-balanced": { displayName: "Ideogram V3 Balanced", provider: "Ideogram", familyKey: "ideogram", creditCost: 2, minTier: "pro", description: "Balanced quality and speed", estimatedCostUSD: 0.06, pricingLabel: "Est. $0.060 / req", transport: "openai-image" },
  "ideogram-ai/ideogram-v3-quality": { displayName: "Ideogram V3 Quality", provider: "Ideogram", familyKey: "ideogram", creditCost: 3, minTier: "max", description: "Maximum quality ideograms", estimatedCostUSD: 0.08, pricingLabel: "Est. $0.080 / req", transport: "openai-image" },
  // ── Recraft ─────────────────────────────────────────
  "recraft-ai/recraft-v3": { displayName: "Recraft V3", provider: "Recraft", familyKey: "recraft", creditCost: 2, minTier: "pro", description: "Professional design-ready images", estimatedCostUSD: 0.04, pricingLabel: "Est. $0.040 / req", transport: "openai-image" },
  "recraft-ai/recraft-v3-svg": { displayName: "Recraft V3 SVG", provider: "Recraft", familyKey: "recraft", creditCost: 3, minTier: "max", description: "Vector SVG generation", estimatedCostUSD: 0.06, pricingLabel: "Est. $0.060 / req", transport: "openai-image" },
  // ── Stability AI ────────────────────────────────────
  "stability-ai/stable-diffusion-3.5-large": { displayName: "SD 3.5 Large", provider: "Stability AI", familyKey: "stability", creditCost: 2, minTier: "pro", description: "Stable Diffusion 3.5 large", estimatedCostUSD: 0.065, pricingLabel: "Est. $0.065 / req", transport: "openai-image" },
  "stability-ai/stable-diffusion-3.5-large-turbo": { displayName: "SD 3.5 Turbo", provider: "Stability AI", familyKey: "stability", creditCost: 1, minTier: "pro", description: "Fast Stable Diffusion 3.5", estimatedCostUSD: 0.04, pricingLabel: "Est. $0.040 / req", transport: "openai-image" },
};

export const VIDEO_MODELS: Record<string, ModelInfo> = {
  // ── OpenAI ──────────────────────────────────────────
  "sora-2": { displayName: "Sora 2", provider: "OpenAI", familyKey: "openai", creditCost: 5, minTier: "pro", description: "OpenAI flagship video generation", estimatedCostUSD: 0.50, pricingLabel: "$0.08 / sec", transport: "video-generate" },
  "sora-2-pro": { displayName: "Sora 2 Pro", provider: "OpenAI", familyKey: "openai", creditCost: 8, minTier: "max", description: "Highest quality Sora output", estimatedCostUSD: 1.00, pricingLabel: "$0.24 / sec", transport: "video-generate" },
  // ── Google (Veo) ────────────────────────────────────
  "veo3": { displayName: "Veo 3", provider: "Google", familyKey: "google", creditCost: 4, minTier: "pro", description: "Google cinematic video model", estimatedCostUSD: 0.35, pricingLabel: "Est. $0.35 / req", transport: "video-generate" },
  "veo3-fast": { displayName: "Veo 3 Fast", provider: "Google", familyKey: "google", creditCost: 3, minTier: "pro", description: "Fast Google video generation", estimatedCostUSD: 0.20, pricingLabel: "Est. $0.20 / req", transport: "video-generate" },
  "veo3-pro": { displayName: "Veo 3 Pro", provider: "Google", familyKey: "google", creditCost: 6, minTier: "max", description: "Premium cinematic quality", estimatedCostUSD: 0.50, pricingLabel: "Est. $0.50 / req", transport: "video-generate" },
  "veo3.1": { displayName: "Veo 3.1", provider: "Google", familyKey: "google", creditCost: 4, minTier: "pro", description: "Latest Google video model", estimatedCostUSD: 0.35, pricingLabel: "Est. $0.35 / req", transport: "video-generate" },
  "veo3.1-pro": { displayName: "Veo 3.1 Pro", provider: "Google", familyKey: "google", creditCost: 7, minTier: "max", description: "Premium Veo 3.1 quality", estimatedCostUSD: 0.55, pricingLabel: "Est. $0.55 / req", transport: "video-generate" },
  // ── Kling ───────────────────────────────────────────
  "kling_video": { displayName: "Kling 2.5", provider: "Kling", familyKey: "kling", creditCost: 3, minTier: "pro", description: "High-quality video generation", estimatedCostUSD: 0.20, pricingLabel: "Est. $0.20 / req", transport: "video-generate" },
  "kling_omni_video": { displayName: "Kling Omni", provider: "Kling", familyKey: "kling", creditCost: 4, minTier: "max", description: "Kling omni-modal video", estimatedCostUSD: 0.30, pricingLabel: "Est. $0.30 / req", transport: "video-generate" },
  // ── Luma ────────────────────────────────────────────
  "luma_video": { displayName: "Luma Dream Machine", provider: "Luma", familyKey: "luma", creditCost: 4, minTier: "pro", description: "Luma AI video generation", estimatedCostUSD: 0.25, pricingLabel: "Est. $0.25 / req", transport: "video-generate" },
  "luma_fast_video": { displayName: "Luma Fast", provider: "Luma", familyKey: "luma", creditCost: 3, minTier: "pro", description: "Fast Luma video generation", estimatedCostUSD: 0.15, pricingLabel: "Est. $0.15 / req", transport: "video-generate" },
  // ── Runway ──────────────────────────────────────────
  "runway_video": { displayName: "Runway Gen-3", provider: "Runway", familyKey: "runway", creditCost: 5, minTier: "max", description: "Runway Gen-3 Alpha video", estimatedCostUSD: 0.50, pricingLabel: "Est. $0.50 / req", transport: "video-generate" },
  // ── MiniMax / Hailuo ────────────────────────────────
  "minimax_video-01": { displayName: "MiniMax Video", provider: "MiniMax", familyKey: "minimax", creditCost: 3, minTier: "pro", description: "MiniMax Hailuo video generation", estimatedCostUSD: 0.15, pricingLabel: "Est. $0.15 / req", transport: "video-generate" },
  // ── Wan ─────────────────────────────────────────────
  "wan2.5-t2v-preview": { displayName: "Wan 2.5", provider: "Wan", familyKey: "wan", creditCost: 3, minTier: "pro", description: "Wan text-to-video preview", estimatedCostUSD: 0.15, pricingLabel: "Est. $0.15 / req", transport: "video-generate" },
};

export type ImageModelId = string;
export type VideoModelId = string;
export type ModelId = string;

export const ALL_IMAGE_MODEL_IDS = Object.keys(IMAGE_MODELS);
export const ALL_VIDEO_MODEL_IDS = Object.keys(VIDEO_MODELS);
export const ALL_MODEL_IDS = [...ALL_IMAGE_MODEL_IDS, ...ALL_VIDEO_MODEL_IDS];

export function isImageModel(id: string): id is ImageModelId {
  return id in IMAGE_MODELS;
}

export function isVideoModel(id: string): id is VideoModelId {
  return id in VIDEO_MODELS;
}

export function getModelCreditCost(modelId: string): number {
  const info = IMAGE_MODELS[modelId] ?? VIDEO_MODELS[modelId];
  if (!info) throw new Error(`Unknown model ID: ${modelId}`);
  return info.creditCost;
}

export function getModelInfo(modelId: string): ModelInfo | null {
  const staticInfo = IMAGE_MODELS[modelId] ?? VIDEO_MODELS[modelId];
  if (staticInfo) {
    const providerIcon = getBrandIconUrl(staticInfo.provider) ?? getBrandIconUrl(staticInfo.familyKey);
    return {
      ...staticInfo,
      id: modelId,
      brandIconUrl: staticInfo.brandIconUrl ?? providerIcon ?? undefined,
      iconUrl: staticInfo.iconUrl ?? staticInfo.brandIconUrl ?? providerIcon ?? undefined,
    };
  }

  return inferModelInfo(modelId);
}

function buildProviderGroups(models: Record<string, ModelInfo>) {
  const groups: Record<string, { id: string; info: ModelInfo }[]> = {};
  for (const [id, info] of Object.entries(models)) {
    const group = groups[info.provider] ?? (groups[info.provider] = []);
    group.push({ id, info });
  }
  return groups;
}

const PROVIDER_GROUPS = {
  image: buildProviderGroups(IMAGE_MODELS),
  video: buildProviderGroups(VIDEO_MODELS),
} as const;

export function getProviderGroups(type: "image" | "video") {
  return PROVIDER_GROUPS[type];
}
