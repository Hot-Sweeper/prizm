import { Worker } from "bullmq";
import IORedis from "ioredis";
import { generateImage } from "@/lib/ai/image-generation";
import { uploadResultToR2, updateJobStatus } from "./shared/process-job";
import type { ImageJobData } from "@/lib/queue/job-types";

// Workers must create their own Redis connection (separate from the queue/app)
const connection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

const concurrency = Number(process.env.IMAGE_WORKER_CONCURRENCY ?? 5);

const worker = new Worker<ImageJobData>(
  "image-generation",
  async (job) => {
    const { userId, jobDbId, modelId, prompt, settings } = job.data;

    await updateJobStatus(jobDbId, "processing");

    const result = await generateImage({
      userId,
      jobId: jobDbId,
      modelId,
      prompt,
      type: "image",
      settings,
    });

    const publicUrl = await uploadResultToR2(jobDbId, result.url, "image");

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
  console.error(`[image-worker] Job ${job?.id} failed:`, err.message);
});

worker.on("error", (err) => {
  console.error("[image-worker] Worker error:", err);
});

console.log(`[image-worker] Started with concurrency ${concurrency}`);
