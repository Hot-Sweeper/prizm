export const IMAGE_MODELS = {
  "dall-e-3": {
    displayName: "DALL-E 3",
    creditCost: 1,
    minTier: "free" as const,
    description: "Fast, versatile image generation",
  },
  "gpt-image-1": {
    displayName: "GPT Image",
    creditCost: 2,
    minTier: "pro" as const,
    description: "OpenAI's most advanced image model",
  },
} as const;

export const VIDEO_MODELS = {
  "kling_video": {
    displayName: "Kling 2.5",
    creditCost: 3,
    minTier: "pro" as const,
    description: "High-quality video generation",
  },
  "sora-2": {
    displayName: "Sora 2",
    creditCost: 5,
    minTier: "pro" as const,
    description: "OpenAI's flagship video generation",
    costPerSecUSD: 0.08,
  },
  "veo3.1": {
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
