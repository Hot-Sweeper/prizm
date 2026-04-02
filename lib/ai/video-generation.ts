import "server-only";
import { z } from "zod";
import { cometClient } from "./comet-client";
import { isVideoModel } from "./models";
import type { GenerationRequest, GenerationResult } from "./types";

const videoSettingsSchema = z.object({
  duration: z.number().min(1).max(10).optional().default(5),
  aspectRatio: z.enum(["16:9", "9:16", "1:1"]).optional().default("16:9"),
});

export async function generateVideo(
  request: GenerationRequest
): Promise<GenerationResult> {
  if (!isVideoModel(request.modelId)) {
    throw new Error(`Invalid video model: ${request.modelId}`);
  }

  const settings = videoSettingsSchema.parse(request.settings ?? {});

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
      duration: settings.duration,
      aspect_ratio: settings.aspectRatio,
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
