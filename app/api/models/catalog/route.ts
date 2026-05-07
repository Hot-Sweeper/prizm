import { auth } from "@/auth";
import { isLocalhostRequestUrl } from "@/lib/credits/whitelist";
import { getLiveModelCatalog } from "@/lib/ai/live-model-catalog";
import { getModelCapabilityProfile } from "@/lib/ai/model-capabilities";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const isLocalDev = isLocalhostRequestUrl(request.url);
  const session = await auth();
  if (!session?.user?.id && !isLocalDev) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const catalog = await getLiveModelCatalog();

  return NextResponse.json({
    fetchedAt: catalog.fetchedAt,
    imageModels: catalog.imageModels.map((model) => ({
      ...model,
      capabilityProfile: getModelCapabilityProfile(model),
    })),
    videoModels: catalog.videoModels.map((model) => ({
      ...model,
      capabilityProfile: getModelCapabilityProfile(model),
    })),
  });
}