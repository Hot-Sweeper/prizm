import { redis } from "./redis";
import { imageQueue, videoQueue } from "./queues";
import { TIER_PRIORITY } from "./job-types";
import type { ImageJobData, VideoJobData } from "./job-types";

const RATE_LIMIT_WINDOW_SECONDS = 60;
const RATE_LIMITS: Record<"free" | "pro" | "max", number> = {
  free: 2,
  pro: 10,
  max: 30,
};

interface EnqueueParams {
  userId: string;
  jobDbId: string;
  type: "image" | "video";
  prompt: string;
  modelId: string;
  settings?: Record<string, unknown>;
  tier: "free" | "pro" | "max";
}

/** Enqueues a generation job. Returns the BullMQ job ID. */
export async function enqueueGeneration(params: EnqueueParams): Promise<string> {
  // Per-user rate limiting per credit type
  const rateLimitKey = `rate:${params.type}:${params.userId}`;
  const currentCount = await redis.incr(rateLimitKey);

  if (currentCount === 1) {
    // Set TTL only on first increment to avoid resetting the window
    await redis.expire(rateLimitKey, RATE_LIMIT_WINDOW_SECONDS);
  }

  const limit = RATE_LIMITS[params.tier];
  if (currentCount > limit) {
    throw new Error(
      `Rate limit exceeded: ${params.type} generation limit is ${limit}/minute for ${params.tier} tier`
    );
  }

  const priority = TIER_PRIORITY[params.tier];
  const jobData: ImageJobData | VideoJobData = {
    userId: params.userId,
    jobDbId: params.jobDbId,
    modelId: params.modelId,
    prompt: params.prompt,
    settings: params.settings,
  };

  const queue = params.type === "image" ? imageQueue : videoQueue;
  const job = await queue.add(params.type, jobData, { priority });

  return job.id!;
}
