import { Queue } from "bullmq";
import { redis } from "./redis";
import type { ImageJobData, VideoJobData } from "./job-types";

const defaultJobOptions = {
  attempts: 3,
  backoff: { type: "exponential" as const, delay: 5000 },
  removeOnComplete: { age: 3600 },  // keep completed jobs 1 hour for polling
  removeOnFail: { age: 86400 },     // keep failed jobs 24 hours for debugging
};

export const imageQueue = new Queue<ImageJobData>("image-generation", {
  connection: redis,
  defaultJobOptions,
});

export const videoQueue = new Queue<VideoJobData>("video-generation", {
  connection: redis,
  defaultJobOptions,
});
