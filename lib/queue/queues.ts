import { Queue } from "bullmq";
import { redis } from "./redis";
import type { ImageJobData, VideoJobData } from "./job-types";

const defaultJobOptions = {
  attempts: 3,
  backoff: { type: "exponential" as const, delay: 5000 },
  removeOnComplete: { age: 3600 },
  removeOnFail: { age: 86400 },
};

function getImageQueue() {
  if (!redis) throw new Error("Redis not configured — cannot use image queue");
  return new Queue<ImageJobData>("image-generation", {
    connection: redis,
    defaultJobOptions,
  });
}

function getVideoQueue() {
  if (!redis) throw new Error("Redis not configured — cannot use video queue");
  return new Queue<VideoJobData>("video-generation", {
    connection: redis,
    defaultJobOptions,
  });
}

let _imageQueue: Queue<ImageJobData> | undefined;
let _videoQueue: Queue<VideoJobData> | undefined;

export const imageQueue = new Proxy({} as Queue<ImageJobData>, {
  get(_, prop) {
    _imageQueue ??= getImageQueue();
    return (_imageQueue as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export const videoQueue = new Proxy({} as Queue<VideoJobData>, {
  get(_, prop) {
    _videoQueue ??= getVideoQueue();
    return (_videoQueue as unknown as Record<string | symbol, unknown>)[prop];
  },
});
