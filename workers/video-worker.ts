import { Worker } from "bullmq";
import IORedis from "ioredis";
import { generateVideo } from "@/lib/ai/video-generation";
import { uploadResultToR2, updateJobStatus } from "./shared/process-job";
import type { VideoJobData } from "@/lib/queue/job-types";

const connection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

const concurrency = Number(process.env.VIDEO_WORKER_CONCURRENCY ?? 2);

const worker = new Worker<VideoJobData>(
  "video-generation",
  async (job) => {
    const { userId, jobDbId, modelId, prompt, settings } = job.data;

    await updateJobStatus(jobDbId, "processing");

    const result = await generateVideo({
      userId,
      jobId: jobDbId,
      modelId,
      prompt,
      type: "video",
      settings,
    });

    const publicUrl = await uploadResultToR2(jobDbId, result.url, "video");

    if (!publicUrl) {
      throw new Error("Upload to R2 returned no URL — aborting job completion");
    }

    await updateJobStatus(jobDbId, "completed", { resultUrl: publicUrl });
  },
  { connection, concurrency }
);

worker.on("failed", async (job, err) => {
  if (job) {
    await updateJobStatus(job.data.jobDbId, "failed", {
      errorMessage: err.message,
    });
  }
  console.error(`[video-worker] Job ${job?.id} failed:`, err.message);
});

worker.on("error", (err) => {
  console.error("[video-worker] Worker error:", err);
});

console.log(`[video-worker] Started with concurrency ${concurrency}`);
