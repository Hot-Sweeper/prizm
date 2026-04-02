export const IMAGE_MODELS = {
  "flux-2": {
    displayName: "Flux 2",
    creditCost: 1,
    minTier: "free" as const,
    description: "Fast, high-quality image generation",
  },
  "nano-banana-pro": {
    displayName: "Nano Banana Pro",
    creditCost: 2,
    minTier: "pro" as const,
    description: "Premium quality with enhanced detail",
  },
} as const;

export const VIDEO_MODELS = {
  "kling-2.5": {
    displayName: "Kling 2.5",
    creditCost: 3,
    minTier: "pro" as const,
    description: "High-quality video generation",
  },
  "sora-2": {
    displayName: "Sora 2",
    creditCost: 5,
    minTier: "pro" as const,
    description: "OpenAI's latest video model",
    costPerSecUSD: 0.08,
  },
  "veo-3.1": {
    displayName: "Veo 3.1",
    creditCost: 4,
    minTier: "max" as const,
    description: "Google's cinematic video model",
  },
} as const;

export type ImageModelId = keyof typeof IMAGE_MODELS;
export type VideoModelId = keyof typeof VIDEO_MODELS;
export type ModelId = ImageModelId | VideoModelId;

export const ALL_IMAGE_MODEL_IDS = Object.keys(IMAGE_MODELS) as ImageModelId[];
export const ALL_VIDEO_MODEL_IDS = Object.keys(VIDEO_MODELS) as VideoModelId[];
export const ALL_MODEL_IDS = [
  ...ALL_IMAGE_MODEL_IDS,
  ...ALL_VIDEO_MODEL_IDS,
] as ModelId[];

export function isImageModel(id: string): id is ImageModelId {
  return id in IMAGE_MODELS;
}

export function isVideoModel(id: string): id is VideoModelId {
  return id in VIDEO_MODELS;
}

export function getModelCreditCost(modelId: string): number {
  if (isImageModel(modelId)) return IMAGE_MODELS[modelId].creditCost;
  if (isVideoModel(modelId)) return VIDEO_MODELS[modelId].creditCost;
  throw new Error(`Unknown model ID: ${modelId}`);
}
