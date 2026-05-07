import "server-only";
import { z } from "zod";
import { getLiveModelById } from "./live-model-catalog";
import type { GenerationRequest, GenerationResult } from "./types";

const videoSettingsSchema = z.object({
  duration: z.number().min(1).max(15).optional(),
  seconds: z.union([z.string(), z.number()]).optional(),
  aspectRatio: z.string().optional(),
  size: z.string().optional(),
});

export async function generateVideo(
  request: GenerationRequest
): Promise<GenerationResult> {
  const liveModel = await getLiveModelById(request.modelId);
  if (!liveModel || liveModel.type !== "video") {
    throw new Error(`Invalid video model: ${request.modelId}`);
  }

  const settings = videoSettingsSchema.parse(request.settings ?? {});
  const duration = typeof settings.duration === "number" ? settings.duration : Number(settings.seconds ?? 5);
  const aspectRatio = settings.aspectRatio ?? settings.size ?? "16:9";

  // CometAPI video endpoint — uses a custom path (not OpenAI images API)
  // Using raw fetch via the underlying HTTP client since video is not part of
  // the standard OpenAI SDK surface.
  const response = await fetch("https://api.cometapi.com/v1/videos/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.COMETAPI_API_KEY}`,
    },
    body: JSON.stringify({
      model: request.modelId,
      prompt: request.prompt,
      duration,
      aspect_ratio: aspectRatio,
      size: settings.size,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `CometAPI video generation failed (${response.status}): ${errorBody}`
    );
  }

  const data = (await response.json()) as { url?: string };
  const url = data.url;

  if (!url) {
    throw new Error("CometAPI returned no video URL");
  }

  return {
    url,
    modelId: request.modelId,
    type: "video",
  };
}
