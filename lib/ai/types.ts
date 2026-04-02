export type GenerationType = "image" | "video";

export interface GenerationRequest {
  userId: string;
  jobId: string;
  modelId: string;
  prompt: string;
  type: GenerationType;
  settings?: Record<string, unknown>;
}

export interface GenerationResult {
  url: string;
  modelId: string;
  type: GenerationType;
}

export interface CometAPIError extends Error {
  status?: number;
  code?: string;
}
