export interface ImageJobData {
  userId: string;
  jobDbId: string;
  modelId: string;
  prompt: string;
  settings?: Record<string, unknown>;
}

export interface VideoJobData {
  userId: string;
  jobDbId: string;
  modelId: string;
  prompt: string;
  settings?: Record<string, unknown>;
}

export type QueuePriority = 1 | 5 | 10;

/** Maps subscription tier to BullMQ queue priority (lower = higher priority) */
export const TIER_PRIORITY: Record<"free" | "pro" | "max", QueuePriority> = {
  free: 10,
  pro: 5,
  max: 1,
};
