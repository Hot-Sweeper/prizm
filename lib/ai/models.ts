export interface ModelInfo {
  displayName: string;
  provider: string;
  creditCost: number;
  minTier: "free" | "pro" | "max";
  description: string;
  estimatedCostUSD: number;
}

export const IMAGE_MODELS: Record<string, ModelInfo> = {
  // ── OpenAI ──────────────────────────────────────────
  "dall-e-2": { displayName: "DALL-E 2", provider: "OpenAI", creditCost: 1, minTier: "free", description: "Classic image generation", estimatedCostUSD: 0.02 },
  "dall-e-3": { displayName: "DALL-E 3", provider: "OpenAI", creditCost: 1, minTier: "free", description: "Fast, versatile image generation", estimatedCostUSD: 0.04 },
  "gpt-image-1": { displayName: "GPT Image", provider: "OpenAI", creditCost: 2, minTier: "pro", description: "Most advanced image model", estimatedCostUSD: 0.07 },
  "gpt-image-1-mini": { displayName: "GPT Image Mini", provider: "OpenAI", creditCost: 1, minTier: "free", description: "Fast, affordable GPT images", estimatedCostUSD: 0.02 },
  "gpt-image-1.5": { displayName: "GPT Image 1.5", provider: "OpenAI", creditCost: 2, minTier: "pro", description: "Enhanced GPT image generation", estimatedCostUSD: 0.08 },
  // ── Flux (Black Forest Labs) ────────────────────────
  "flux-schnell": { displayName: "Flux Schnell", provider: "Flux", creditCost: 1, minTier: "free", description: "Fastest Flux model, great for drafts", estimatedCostUSD: 0.003 },
  "flux-dev": { displayName: "Flux Dev", provider: "Flux", creditCost: 1, minTier: "pro", description: "Open-source development model", estimatedCostUSD: 0.025 },
  "flux-pro-1.1": { displayName: "Flux Pro 1.1", provider: "Flux", creditCost: 2, minTier: "pro", description: "Production-quality generation", estimatedCostUSD: 0.04 },
  "flux-pro-1.1-ultra": { displayName: "Flux Pro Ultra", provider: "Flux", creditCost: 3, minTier: "max", description: "Highest-quality Flux output", estimatedCostUSD: 0.06 },
  "flux-2-pro": { displayName: "Flux 2 Pro", provider: "Flux", creditCost: 3, minTier: "max", description: "Latest Flux 2 production model", estimatedCostUSD: 0.05 },
  "flux-2-max": { displayName: "Flux 2 Max", provider: "Flux", creditCost: 4, minTier: "max", description: "Maximum quality Flux 2", estimatedCostUSD: 0.07 },
  "flux-kontext-pro": { displayName: "Flux Kontext Pro", provider: "Flux", creditCost: 2, minTier: "pro", description: "Context-aware editing model", estimatedCostUSD: 0.04 },
  "flux-kontext-max": { displayName: "Flux Kontext Max", provider: "Flux", creditCost: 3, minTier: "max", description: "Maximum quality context editing", estimatedCostUSD: 0.06 },
  // ── Ideogram ────────────────────────────────────────
  "ideogram-ai/ideogram-v3-turbo": { displayName: "Ideogram V3 Turbo", provider: "Ideogram", creditCost: 2, minTier: "pro", description: "Fast ideogram generation", estimatedCostUSD: 0.04 },
  "ideogram-ai/ideogram-v3-balanced": { displayName: "Ideogram V3 Balanced", provider: "Ideogram", creditCost: 2, minTier: "pro", description: "Balanced quality and speed", estimatedCostUSD: 0.06 },
  "ideogram-ai/ideogram-v3-quality": { displayName: "Ideogram V3 Quality", provider: "Ideogram", creditCost: 3, minTier: "max", description: "Maximum quality ideograms", estimatedCostUSD: 0.08 },
  // ── Recraft ─────────────────────────────────────────
  "recraft-ai/recraft-v3": { displayName: "Recraft V3", provider: "Recraft", creditCost: 2, minTier: "pro", description: "Professional design-ready images", estimatedCostUSD: 0.04 },
  "recraft-ai/recraft-v3-svg": { displayName: "Recraft V3 SVG", provider: "Recraft", creditCost: 3, minTier: "max", description: "Vector SVG generation", estimatedCostUSD: 0.06 },
  // ── Stability AI ────────────────────────────────────
  "stability-ai/stable-diffusion-3.5-large": { displayName: "SD 3.5 Large", provider: "Stability AI", creditCost: 2, minTier: "pro", description: "Stable Diffusion 3.5 large", estimatedCostUSD: 0.065 },
  "stability-ai/stable-diffusion-3.5-large-turbo": { displayName: "SD 3.5 Turbo", provider: "Stability AI", creditCost: 1, minTier: "pro", description: "Fast Stable Diffusion 3.5", estimatedCostUSD: 0.04 },
};

export const VIDEO_MODELS: Record<string, ModelInfo> = {
  // ── OpenAI ──────────────────────────────────────────
  "sora-2": { displayName: "Sora 2", provider: "OpenAI", creditCost: 5, minTier: "pro", description: "OpenAI flagship video generation", estimatedCostUSD: 0.50 },
  "sora-2-pro": { displayName: "Sora 2 Pro", provider: "OpenAI", creditCost: 8, minTier: "max", description: "Highest quality Sora output", estimatedCostUSD: 1.00 },
  // ── Google (Veo) ────────────────────────────────────
  "veo3": { displayName: "Veo 3", provider: "Google", creditCost: 4, minTier: "pro", description: "Google cinematic video model", estimatedCostUSD: 0.35 },
  "veo3-fast": { displayName: "Veo 3 Fast", provider: "Google", creditCost: 3, minTier: "pro", description: "Fast Google video generation", estimatedCostUSD: 0.20 },
  "veo3-pro": { displayName: "Veo 3 Pro", provider: "Google", creditCost: 6, minTier: "max", description: "Premium cinematic quality", estimatedCostUSD: 0.50 },
  "veo3.1": { displayName: "Veo 3.1", provider: "Google", creditCost: 4, minTier: "pro", description: "Latest Google video model", estimatedCostUSD: 0.35 },
  "veo3.1-pro": { displayName: "Veo 3.1 Pro", provider: "Google", creditCost: 7, minTier: "max", description: "Premium Veo 3.1 quality", estimatedCostUSD: 0.55 },
  // ── Kling ───────────────────────────────────────────
  "kling_video": { displayName: "Kling 2.5", provider: "Kling", creditCost: 3, minTier: "pro", description: "High-quality video generation", estimatedCostUSD: 0.20 },
  "kling_omni_video": { displayName: "Kling Omni", provider: "Kling", creditCost: 4, minTier: "max", description: "Kling omni-modal video", estimatedCostUSD: 0.30 },
  // ── Luma ────────────────────────────────────────────
  "luma_video": { displayName: "Luma Dream Machine", provider: "Luma", creditCost: 4, minTier: "pro", description: "Luma AI video generation", estimatedCostUSD: 0.25 },
  "luma_fast_video": { displayName: "Luma Fast", provider: "Luma", creditCost: 3, minTier: "pro", description: "Fast Luma video generation", estimatedCostUSD: 0.15 },
  // ── Runway ──────────────────────────────────────────
  "runway_video": { displayName: "Runway Gen-3", provider: "Runway", creditCost: 5, minTier: "max", description: "Runway Gen-3 Alpha video", estimatedCostUSD: 0.50 },
  // ── MiniMax / Hailuo ────────────────────────────────
  "minimax_video-01": { displayName: "MiniMax Video", provider: "MiniMax", creditCost: 3, minTier: "pro", description: "MiniMax Hailuo video generation", estimatedCostUSD: 0.15 },
  // ── Wan ─────────────────────────────────────────────
  "wan2.5-t2v-preview": { displayName: "Wan 2.5", provider: "Wan", creditCost: 3, minTier: "pro", description: "Wan text-to-video preview", estimatedCostUSD: 0.15 },
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
  return IMAGE_MODELS[modelId] ?? VIDEO_MODELS[modelId] ?? null;
}

export function getProviderGroups(type: "image" | "video") {
  const models = type === "image" ? IMAGE_MODELS : VIDEO_MODELS;
  const groups: Record<string, { id: string; info: ModelInfo }[]> = {};
  for (const [id, info] of Object.entries(models)) {
    const group = groups[info.provider] ?? (groups[info.provider] = []);
    group.push({ id, info });
  }
  return groups;
}
