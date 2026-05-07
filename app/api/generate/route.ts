import { auth } from "@/auth";
import { db } from "@/lib/db";
import { generationJobs } from "@/lib/db/schema";
import { deductCredits } from "@/lib/credits";
import { isWhitelistedEmail } from "@/lib/credits/whitelist";
import { enqueueGeneration } from "@/lib/queue/enqueue";
import { cometClient } from "@/lib/ai/comet-client";
import { getModelInfo } from "@/lib/ai/models";
import { getLiveModelById } from "@/lib/ai/live-model-catalog";
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
  referenceImages: z
    .array(z.string().max(15_000_000))
    .max(5)
    .optional(),
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
 * Processes a generation job in the background (fire-and-forget).
 * Updates the DB row when complete or failed.
 */
function processDirectInBackground(
  jobId: string,
  userId: string,
  type: "image" | "video",
  modelId: string,
  prompt: string,
  settings?: Record<string, unknown>
) {
  const modelInfo = getModelInfo(modelId);

  const work = async () => {
    try {
      const liveModel = await getLiveModelById(modelId);
      const resolvedModelInfo = liveModel ?? modelInfo;

      await db
        .update(generationJobs)
        .set({ status: "processing", updatedAt: new Date() })
        .where(eq(generationJobs.id, jobId));

      let url: string;

      if (type === "image") {
        if (resolvedModelInfo?.transport === "gemini-image") {
          // Build parts: reference images first (if any), then the text prompt
          const referenceImages = (settings?.referenceImages as string[] | undefined) ?? [];
          const imageParts = referenceImages
            .map((dataUrl) => {
              const match = /^data:(image\/[a-z+]+);base64,(.+)$/.exec(dataUrl);
              if (!match) return null;
              return { inlineData: { mimeType: match[1], data: match[2] } };
            })
            .filter(Boolean);

          const requestBody = JSON.stringify({
            contents: [{ role: "user", parts: [...imageParts, { text: prompt }] }],
            generationConfig: {
              responseModalities: ["IMAGE"],
              imageConfig: {
                aspectRatio: (settings?.aspectRatio as string) ?? "1:1",
                imageSize: (settings?.imageSize as string) ?? "1K",
              },
            },
          });

          console.log(`[direct] Job ${jobId}: Gemini request — ${imageParts.length} ref images, body size ${(requestBody.length / 1024).toFixed(0)}KB`);

          const response = await fetch(
            `https://api.cometapi.com/v1beta/models/${modelId}:generateContent`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": process.env.COMETAPI_API_KEY ?? "",
              },
              body: requestBody,
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
          };

          const parts = data.candidates?.[0]?.content?.parts ?? [];
          const imagePart = parts.find((part) => part.inlineData?.data);
          const inlineData = imagePart?.inlineData;

          if (!inlineData?.data) {
            throw new Error("Gemini returned no image data");
          }

          url = `data:${inlineData.mimeType ?? "image/png"};base64,${inlineData.data}`;
        } else {
          const response = await cometClient.images.generate({
            model: modelId,
            prompt,
            n: 1,
            size: (settings?.size as "1024x1024" | "1024x1792" | "1792x1024" | undefined) ?? "1024x1024",
            quality:
              settings?.quality === "low" ||
              settings?.quality === "medium" ||
              settings?.quality === "high" ||
              settings?.quality === "auto" ||
              settings?.quality === "standard" ||
              settings?.quality === "hd"
                ? settings.quality
                : undefined,
            response_format: "url",
          });
          const first = response.data?.[0];
          if (!first?.url) throw new Error("CometAPI returned no image URL");
          url = first.url;
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
            duration: Number(settings?.seconds ?? settings?.duration ?? 5),
            aspect_ratio: (settings?.aspectRatio as string) ?? (settings?.size as string) ?? "16:9",
            size: (settings?.size as string | undefined) ?? undefined,
          }),
        });
        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(`Video generation failed (${response.status}): ${errorBody}`);
        }
        const data = (await response.json()) as Record<string, unknown>;
        url = data.url as string;
        if (!url) throw new Error("CometAPI returned no video URL");
      }

      await db
        .update(generationJobs)
        .set({ status: "completed", resultUrl: url, updatedAt: new Date() })
        .where(eq(generationJobs.id, jobId));

      console.log(`[direct] Job ${jobId} completed`);
    } catch (err) {
      const rawMsg = err instanceof Error ? err.message : String(err);
      const cause = err instanceof Error && err.cause ? ` | cause: ${JSON.stringify(err.cause)}` : "";
      const errorMsg = `${rawMsg}${cause}`;
      console.error(`[direct] Job ${jobId} failed:`, errorMsg);
      await db
        .update(generationJobs)
        .set({ status: "failed", errorMessage: rawMsg.slice(0, 500), updatedAt: new Date() })
        .where(eq(generationJobs.id, jobId))
        .catch(() => {});
    }
  };

  work().catch(() => {});
}

/**
 * Enqueues a direct generation for whitelisted users — creates a DB job and
 * processes in the background so the API responds instantly.
 */
async function directGenerate(
  userId: string,
  type: "image" | "video",
  modelId: string,
  prompt: string,
  dbSettings: Record<string, unknown> | null,
  runtimeSettings?: Record<string, unknown>
) {
  const [newJob] = await db
    .insert(generationJobs)
    .values({
      userId,
      type,
      status: "queued",
      modelId,
      prompt,
      settings: dbSettings,
      queuePriority: 0,
      creditCost: 0,
    })
    .returning({ id: generationJobs.id });

  if (!newJob) {
    return NextResponse.json({ error: "Failed to create job" }, { status: 500 });
  }

  processDirectInBackground(newJob.id, userId, type, modelId, prompt, runtimeSettings);

  return NextResponse.json({ jobId: newJob.id, status: "queued" }, { status: 201 });
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

  const { prompt, modelId, type, referenceImages } = parsed.data;
  const liveModel = await getLiveModelById(modelId);

  if (!liveModel || liveModel.type !== type) {
    return NextResponse.json({ error: `Unknown ${type} model` }, { status: 400 });
  }

  // Keep base64 reference images OUT of db-persisted settings to avoid multi-MB JSONB rows
  const dbSettings = parsed.data.settings ?? null;
  const runtimeSettings = {
    ...parsed.data.settings,
    ...(referenceImages?.length && { referenceImages }),
  };

  // Whitelisted users: direct CometAPI call — no queue, no credits
  if (isWhitelistedEmail(session.user.email)) {
    try {
      return await directGenerate(session.user.id, type, modelId, prompt, dbSettings, runtimeSettings);
    } catch (err) {
      console.error("[generate] directGenerate failed:", err instanceof Error ? err.message : err);
      return NextResponse.json(
        { error: "Generation failed. Please try again later." },
        { status: 500 }
      );
    }
  }

  // ── Normal pipeline: DB → credits → BullMQ queue ──
  const subscription = await getSubscriptionByUserId(session.user.id);
  const tier = subscription?.tier ?? "free";

  const modelInfo = liveModel;

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

  const creditCost = modelInfo.creditCost;

  const [newJob] = await db
    .insert(generationJobs)
    .values({
      userId: session.user.id,
      type,
      status: "queued",
      modelId,
      prompt,
      settings: dbSettings,
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
