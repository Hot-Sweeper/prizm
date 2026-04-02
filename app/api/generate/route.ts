import { auth } from "@/auth";
import { db } from "@/lib/db";
import { generationJobs } from "@/lib/db/schema";
import { deductCredits } from "@/lib/credits";
import { enqueueGeneration } from "@/lib/queue/enqueue";
import {
  IMAGE_MODELS,
  VIDEO_MODELS,
  getModelCreditCost,
  isImageModel,
  isVideoModel,
  type ImageModelId,
  type VideoModelId,
} from "@/lib/ai/models";
import { getSubscriptionByUserId } from "@/lib/stripe/subscription";
import { TIER_PRIORITY } from "@/lib/queue/job-types";
import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";

const generateSchema = z.object({
  prompt: z.string().min(3, "Prompt must be at least 3 characters").max(500),
  modelId: z.string(),
  type: z.enum(["image", "video"]),
  settings: z.record(z.string(), z.unknown()).optional(),
});

const TIER_MODEL_ACCESS: Record<
  "free" | "pro" | "max",
  ("free" | "pro" | "max")[]
> = {
  free: ["free"],
  pro: ["free", "pro"],
  max: ["free", "pro", "max"],
};

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = generateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { prompt, modelId, type, settings } = parsed.data;

  // Validate the model ID is known and matches the requested type
  if (type === "image" && !isImageModel(modelId)) {
    return NextResponse.json({ error: "Unknown image model" }, { status: 400 });
  }
  if (type === "video" && !isVideoModel(modelId)) {
    return NextResponse.json({ error: "Unknown video model" }, { status: 400 });
  }

  // Check the user's subscription tier and model access
  const subscription = await getSubscriptionByUserId(session.user.id);
  const tier = subscription?.tier ?? "free";

  // Type-safe model lookup — type already validated via isImageModel/isVideoModel above
  const modelInfo =
    type === "image"
      ? IMAGE_MODELS[modelId as ImageModelId]
      : VIDEO_MODELS[modelId as VideoModelId];
  const allowedTiers = TIER_MODEL_ACCESS[tier];

  if (!allowedTiers.includes(modelInfo.minTier)) {
    return NextResponse.json(
      {
        error: `This model requires ${modelInfo.minTier} tier or higher`,
        requiredTier: modelInfo.minTier,
      },
      { status: 403 }
    );
  }

  const creditCost = getModelCreditCost(modelId);

  // Insert job row first to get the DB ID for credit ledger reference
  const [newJob] = await db
    .insert(generationJobs)
    .values({
      userId: session.user.id,
      type,
      status: "queued",
      modelId,
      prompt,
      settings: settings ?? null,
      queuePriority: TIER_PRIORITY[tier],
      creditCost,
    })
    .returning({ id: generationJobs.id });

  if (!newJob) {
    return NextResponse.json({ error: "Failed to create job" }, { status: 500 });
  }

  // Atomically deduct credits — uses FOR UPDATE lock to prevent race conditions
  const deduction = await deductCredits({
    userId: session.user.id,
    creditType: type,
    amount: creditCost,
    jobId: newJob.id,
  });

  if (!deduction.success) {
    // Roll back the job row since we can't pay for it
    await db.delete(generationJobs).where(eq(generationJobs.id, newJob.id));
    return NextResponse.json(
      { error: "Insufficient credits", balance: deduction.newBalance },
      { status: 402 }
    );
  }

  // Enqueue into BullMQ — this is the only point where CometAPI work is scheduled
  let bullJobId: string;
  try {
    bullJobId = await enqueueGeneration({
      userId: session.user.id,
      jobDbId: newJob.id,
      type,
      prompt,
      modelId,
      settings,
      tier,
    });
  } catch (err) {
    // Rate limit or queue error — refund the credit deduction
    await db.insert(generationJobs).values({
      userId: session.user.id,
      type,
      status: "failed",
      modelId,
      prompt,
      creditCost,
      errorMessage: err instanceof Error ? err.message : "Enqueue failed",
      queuePriority: TIER_PRIORITY[tier],
    });

    // Refund not automated in MVP — log for manual review
    console.error("[generate] Enqueue failed after credit deduction", {
      userId: session.user.id,
      jobId: newJob.id,
      error: err,
    });

    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to queue generation" },
      { status: 429 }
    );
  }

  // Store the BullMQ job ID for polling
  await db
    .update(generationJobs)
    .set({ bullJobId })
    .where(eq(generationJobs.id, newJob.id));

  return NextResponse.json({ jobId: newJob.id, status: "queued" }, { status: 201 });
}
