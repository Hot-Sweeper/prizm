import type { ModelInfo } from "@/lib/ai/models";

export type ModelSettingsInput = "select" | "number" | "text" | "toggle";

export interface ModelSettingOption {
  value: string;
  label: string;
}

export interface ModelSettingField {
  key: string;
  label: string;
  input: ModelSettingsInput;
  defaultValue: string | number | boolean;
  description?: string;
  options?: ModelSettingOption[];
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}

export interface ModelCapabilityProfile {
  key: string;
  fields: ModelSettingField[];
  supportsReferenceImages?: boolean;
  maxReferenceImages?: number;
}

const COMMON_RATIOS = ["1:1", "16:9", "9:16", "4:3", "3:4"];

const PROFILES: Record<string, ModelCapabilityProfile> = {
  openaiImage: {
    key: "openaiImage",
    fields: [
      {
        key: "size",
        label: "Size",
        input: "select",
        defaultValue: "1024x1024",
        options: [
          { value: "1024x1024", label: "1024 x 1024" },
          { value: "1024x1792", label: "1024 x 1792" },
          { value: "1792x1024", label: "1792 x 1024" },
        ],
      },
      {
        key: "quality",
        label: "Quality",
        input: "select",
        defaultValue: "medium",
        options: [
          { value: "low", label: "Low" },
          { value: "medium", label: "Medium" },
          { value: "high", label: "High" },
        ],
      },
    ],
    supportsReferenceImages: true,
    maxReferenceImages: 5,
  },
  geminiImage: {
    key: "geminiImage",
    fields: [
      {
        key: "aspectRatio",
        label: "Aspect Ratio",
        input: "select",
        defaultValue: "1:1",
        options: [
          ...COMMON_RATIOS,
          "2:3",
          "3:2",
          "4:5",
          "5:4",
          "21:9",
          "1:4",
          "4:1",
          "1:8",
          "8:1",
        ].map((value) => ({ value, label: value })),
      },
      {
        key: "imageSize",
        label: "Resolution",
        input: "select",
        defaultValue: "1K",
        options: ["512px", "1K", "2K", "4K"].map((value) => ({ value, label: value })),
      },
      {
        key: "thinkingLevel",
        label: "Thinking",
        input: "select",
        defaultValue: "minimal",
        options: [
          { value: "minimal", label: "Minimal" },
          { value: "high", label: "High" },
        ],
      },
      {
        key: "includeThoughts",
        label: "Include Thoughts",
        input: "toggle",
        defaultValue: false,
      },
    ],
    supportsReferenceImages: true,
    maxReferenceImages: 5,
  },
  soraVideo: {
    key: "soraVideo",
    fields: [
      {
        key: "seconds",
        label: "Duration",
        input: "select",
        defaultValue: "4",
        options: ["4", "8", "12"].map((value) => ({ value, label: `${value}s` })),
      },
      {
        key: "size",
        label: "Format",
        input: "select",
        defaultValue: "1280x720",
        options: ["1280x720", "720x1280", "1792x1024", "1024x1792"].map((value) => ({ value, label: value })),
      },
    ],
    supportsReferenceImages: true,
    maxReferenceImages: 1,
  },
  veoVideo: {
    key: "veoVideo",
    fields: [
      {
        key: "size",
        label: "Orientation",
        input: "select",
        defaultValue: "16x9",
        options: ["16x9", "9x16", "1x1"].map((value) => ({ value, label: value.replace("x", ":") })),
      },
    ],
    supportsReferenceImages: true,
    maxReferenceImages: 1,
  },
  seedanceVideo: {
    key: "seedanceVideo",
    fields: [
      {
        key: "seconds",
        label: "Duration",
        input: "select",
        defaultValue: "5",
        options: ["4", "5", "6", "8", "10", "12", "15"].map((value) => ({ value, label: `${value}s` })),
      },
      {
        key: "size",
        label: "Size",
        input: "select",
        defaultValue: "16:9",
        options: ["16:9", "4:3", "1:1", "3:4", "9:16", "21:9", "1280x720", "1920x1080", "1080x1920"].map((value) => ({ value, label: value })),
      },
    ],
    supportsReferenceImages: true,
    maxReferenceImages: 1,
  },
  genericVideo: {
    key: "genericVideo",
    fields: [
      {
        key: "duration",
        label: "Duration",
        input: "number",
        defaultValue: 5,
        min: 1,
        max: 15,
        step: 1,
      },
      {
        key: "aspectRatio",
        label: "Aspect Ratio",
        input: "select",
        defaultValue: "16:9",
        options: COMMON_RATIOS.map((value) => ({ value, label: value })),
      },
    ],
  },
};

export function getModelCapabilityProfile(model: Pick<ModelInfo, "id" | "transport">): ModelCapabilityProfile {
  const modelId = (model.id ?? "").toLowerCase();

  if (modelId.startsWith("sora")) return PROFILES.soraVideo!;
  if (modelId.startsWith("veo")) return PROFILES.veoVideo!;
  if (modelId.includes("seedance")) return PROFILES.seedanceVideo!;
  if (model.transport === "gemini-image" || modelId.includes("gemini")) return PROFILES.geminiImage!;
  if (model.transport === "openai-image") return PROFILES.openaiImage!;
  return PROFILES.genericVideo!;
}

export function buildDefaultSettings(profile: ModelCapabilityProfile) {
  return Object.fromEntries(profile.fields.map((field) => [field.key, field.defaultValue]));
}

export function normalizeModelSettings(
  profile: ModelCapabilityProfile,
  rawSettings: Record<string, unknown> | undefined,
) {
  const defaults = buildDefaultSettings(profile);
  const normalized = { ...defaults } as Record<string, unknown>;

  for (const field of profile.fields) {
    const candidate = rawSettings?.[field.key];
    if (candidate === undefined || candidate === null || candidate === "") {
      continue;
    }

    if (field.input === "number") {
      const numeric = typeof candidate === "number" ? candidate : Number(candidate);
      if (!Number.isNaN(numeric)) {
        normalized[field.key] = numeric;
      }
      continue;
    }

    if (field.input === "toggle") {
      normalized[field.key] = Boolean(candidate);
      continue;
    }

    normalized[field.key] = String(candidate);
  }

  return normalized;
}