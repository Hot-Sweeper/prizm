import "server-only";
import { z } from "zod";
import { cometClient } from "./comet-client";
import { IMAGE_MODELS, isImageModel } from "./models";
import type { GenerationRequest, GenerationResult } from "./types";

const imageSettingsSchema = z.object({
  size: z
    .enum(["1024x1024", "1024x1792", "1792x1024"])
    .optional()
    .default("1024x1024"),
});

export async function generateImage(
  request: GenerationRequest
): Promise<GenerationResult> {
  if (!isImageModel(request.modelId)) {
    throw new Error(`Invalid image model: ${request.modelId}`);
  }

  const settings = imageSettingsSchema.parse(request.settings ?? {});

  // CometAPI uses the OpenAI-compatible image generation endpoint
  const response = await cometClient.images.generate({
    model: request.modelId,
    prompt: request.prompt,
    n: 1,
    size: settings.size,
    response_format: "url",
  });

  const firstImage = response.data?.[0];
  if (!firstImage?.url) {
    throw new Error("CometAPI returned no image URL");
  }
  const url = firstImage.url;

  return {
    url,
    modelId: request.modelId,
    type: "image",
  };
}
