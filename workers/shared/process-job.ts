import { db } from "@/lib/db";
import { generationJobs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

/** Downloads a remote URL and uploads it to R2. Returns the public URL. */
export async function uploadResultToR2(
  jobId: string,
  remoteUrl: string,
  type: "image" | "video"
): Promise<string> {
  const response = await fetch(remoteUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch result from CometAPI: ${response.status}`);
  }

  const contentType = response.headers.get("content-type") ?? "application/octet-stream";
  const buffer = Buffer.from(await response.arrayBuffer());
  const extension = type === "image" ? "png" : "mp4";
  const key = `results/${jobId}.${extension}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;
  if (!publicUrl) {
    throw new Error("R2_PUBLIC_URL is not configured");
  }

  return publicUrl;
}

export async function updateJobStatus(
  jobDbId: string,
  status: "processing" | "completed" | "failed",
  opts?: { resultUrl?: string; errorMessage?: string }
) {
  await db
    .update(generationJobs)
    .set({
      status,
      ...(opts?.resultUrl && { resultUrl: opts.resultUrl }),
      ...(opts?.errorMessage && { errorMessage: opts.errorMessage }),
      updatedAt: new Date(),
    })
    .where(eq(generationJobs.id, jobDbId));
}
