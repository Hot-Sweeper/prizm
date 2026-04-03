import { auth } from "@/auth";
import { db } from "@/lib/db";
import { generationJobs } from "@/lib/db/schema";
import { deductCredits } from "@/lib/credits";
import { isWhitelistedEmail } from "@/lib/credits/whitelist";
import { enqueueGeneration } from "@/lib/queue/enqueue";
import { cometClient } from "@/lib/ai/comet-client";
import {
  IMAGE_MODELS,
  VIDEO_MODELS,
  getModelCreditCost,
  getModelInfo,
  isImageModel,
  isVideoModel,
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

/**
 * Direct CometAPI call for whitelisted users — bypasses DB, queue, and R2.
 */
async function directGenerate(
  type: "image" | "video",
  modelId: string,
  prompt: string,
) {
  const startTime = Date.now();
  const modelInfo = getModelInfo(modelId);

  try {
    let url: string;
    let rawUsage: unknown = null;

    if (type === "image") {
      if (modelInfo?.transport === "gemini-image") {
        const response = await fetch(
          `https://api.cometapi.com/v1beta/models/${modelId}:generateContent`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": process.env.COMETAPI_API_KEY ?? "",
            },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: prompt }] }],
              generationConfig: {
                responseModalities: ["IMAGE"],
                imageConfig: { aspectRatio: "1:1", imageSize: "1K" },
              },
            }),
          }
        );

        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(`Gemini image generation failed (${response.status}): ${errorBody}`);
        }

        const data = (await response.json()) as {
          candidates?: Array<{
            content?: {
              parts?: Array<{
                inlineData?: { mimeType?: string; data?: string };
              }>;
            };
          }>;
          usageMetadata?: unknown;
        };

        const parts = data.candidates?.[0]?.content?.parts ?? [];
        const imagePart = parts.find((part) => part.inlineData?.data);
        const inlineData = imagePart?.inlineData;

        if (!inlineData?.data) {
          throw new Error("Nano Banana returned no image data");
        }

        url = `data:${inlineData.mimeType ?? "image/png"};base64,${inlineData.data}`;
        rawUsage = data.usageMetadata ?? null;
      } else {
        const response = await cometClient.images.generate({
          model: modelId,
          prompt,
          n: 1,
          size: "1024x1024",
          response_format: "url",
        });
        const first = response.data?.[0];
        if (!first?.url) throw new Error("CometAPI returned no image URL");
        url = first.url;
        rawUsage = (response as unknown as Record<string, unknown>).usage ?? null;
      }
    } else {
      const response = await fetch("https://api.cometapi.com/v1/videos/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.COMETAPI_API_KEY}`,
        },
        body: JSON.stringify({
          model: modelId,
          prompt,
          duration: 5,
          aspect_ratio: "16:9",
        }),
      });
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Video generation failed (${response.status}): ${errorBody}`);
      }
      const data = (await response.json()) as Record<string, unknown>;
      url = data.url as string;
      rawUsage = data.usage ?? null;
      if (!url) throw new Error("CometAPI returned no video URL");
    }

    const generationTimeMs = Date.now() - startTime;

    return NextResponse.json({
      status: "completed",
      url,
      type,
      apiInfo: {
        model: modelId,
        modelName: modelInfo?.displayName ?? modelId,
        provider: modelInfo?.provider ?? "Unknown",
        generationTimeMs,
        estimatedCostUSD: modelInfo?.estimatedCostUSD ?? null,
        pricingLabel: modelInfo?.pricingLabel,
        usage: rawUsage,
      },
    });
  } catch (err) {
    const generationTimeMs = Date.now() - startTime;
    return NextResponse.json(
      {
        status: "failed",
        error: err instanceof Error ? err.message : "Generation failed",
        apiInfo: {
          model: modelId,
          modelName: modelInfo?.displayName ?? modelId,
          provider: modelInfo?.provider ?? "Unknown",
          generationTimeMs,
          estimatedCostUSD: modelInfo?.estimatedCostUSD ?? null,
          pricingLabel: modelInfo?.pricingLabel,
        },
      },
      { status: 500 }
    );
  }
}

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

  const { prompt, modelId, type } = parsed.data;

  if (type === "image" && !isImageModel(modelId)) {
    return NextResponse.json({ error: "Unknown image model" }, { status: 400 });
  }
  if (type === "video" && !isVideoModel(modelId)) {
    return NextResponse.json({ error: "Unknown video model" }, { status: 400 });
  }

  // Whitelisted users: direct CometAPI call — no DB, no queue, no credits
  if (isWhitelistedEmail(session.user.email)) {
    return directGenerate(type, modelId, prompt);
  }

  // ── Normal pipeline: DB → credits → BullMQ queue ──
  const subscription = await getSubscriptionByUserId(session.user.id);
  const tier = subscription?.tier ?? "free";

  const modelInfo = type === "image" ? IMAGE_MODELS[modelId] : VIDEO_MODELS[modelId];
  if (!modelInfo) {
    return NextResponse.json({ error: "Model not found" }, { status: 400 });
  }

  if (modelInfo.directOnly) {
    return NextResponse.json(
      { error: "This model is currently available in direct test mode for whitelisted users only" },
      { status: 403 }
    );
  }

  const allowedTiers = TIER_MODEL_ACCESS[tier];

  if (!allowedTiers.includes(modelInfo.minTier)) {
    return NextResponse.json(
      { error: `This model requires ${modelInfo.minTier} tier or higher`, requiredTier: modelInfo.minTier },
      { status: 403 }
    );
  }

  const creditCost = getModelCreditCost(modelId);

  const [newJob] = await db
    .insert(generationJobs)
    .values({
      userId: session.user.id,
      type,
      status: "queued",
      modelId,
      prompt,
      settings: null,
      queuePriority: TIER_PRIORITY[tier],
      creditCost,
    })
    .returning({ id: generationJobs.id });

  if (!newJob) {
    return NextResponse.json({ error: "Failed to create job" }, { status: 500 });
  }

  const deduction = await deductCredits({
    userId: session.user.id,
    creditType: type,
    amount: creditCost,
    jobId: newJob.id,
  });

  if (!deduction.success) {
    await db.delete(generationJobs).where(eq(generationJobs.id, newJob.id));
    return NextResponse.json(
      { error: "Insufficient credits", balance: deduction.newBalance },
      { status: 402 }
    );
  }

  let bullJobId: string;
  try {
    bullJobId = await enqueueGeneration({
      userId: session.user.id,
      jobDbId: newJob.id,
      type,
      prompt,
      modelId,
      tier,
    });
  } catch (err) {
    console.error("[generate] Enqueue failed after credit deduction", { userId: session.user.id, jobId: newJob.id, error: err });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to queue generation" },
      { status: 429 }
    );
  }

  await db.update(generationJobs).set({ bullJobId }).where(eq(generationJobs.id, newJob.id));

  return NextResponse.json({ jobId: newJob.id, status: "queued" }, { status: 201 });
}
