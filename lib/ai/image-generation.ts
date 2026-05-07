import "server-only";
import { z } from "zod";
import { cometClient } from "./comet-client";
import { getLiveModelById } from "./live-model-catalog";
import type { GenerationRequest, GenerationResult } from "./types";

const imageSettingsSchema = z.object({
  size: z
    .enum(["1024x1024", "1024x1792", "1792x1024"])
    .optional()
    .default("1024x1024"),
  quality: z.enum(["low", "medium", "high"]).optional(),
  aspectRatio: z.string().optional(),
  imageSize: z.string().optional(),
});

export async function generateImage(
  request: GenerationRequest
): Promise<GenerationResult> {
  const liveModel = await getLiveModelById(request.modelId);
  if (!liveModel || liveModel.type !== "image") {
    throw new Error(`Invalid image model: ${request.modelId}`);
  }

  const settings = imageSettingsSchema.parse(request.settings ?? {});

  if (liveModel.transport === "gemini-image") {
    const response = await fetch(`https://api.cometapi.com/v1beta/models/${request.modelId}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.COMETAPI_API_KEY ?? "",
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: request.prompt }] }],
        generationConfig: {
          responseModalities: ["IMAGE"],
          imageConfig: {
            aspectRatio: settings.aspectRatio ?? "1:1",
            imageSize: settings.imageSize ?? "1K",
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini image generation failed (${response.status})`);
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

    const inlineData = data.candidates?.[0]?.content?.parts?.find((part) => part.inlineData?.data)?.inlineData;
    if (!inlineData?.data) {
      throw new Error("CometAPI returned no Gemini image payload");
    }

    return {
      url: `data:${inlineData.mimeType ?? "image/png"};base64,${inlineData.data}`,
      modelId: request.modelId,
      type: "image",
    };
  }

  const response = await cometClient.images.generate({
    model: request.modelId,
    prompt: request.prompt,
    n: 1,
    size: settings.size,
    quality: settings.quality,
    response_format: "url",
  });

  const firstImage = response.data?.[0];
  if (!firstImage?.url) {
    throw new Error("CometAPI returned no image URL");
  }

  return {
    url: firstImage.url,
    modelId: request.modelId,
    type: "image",
  };
}
