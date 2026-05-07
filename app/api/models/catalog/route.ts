import { auth } from "@/auth";
import { getLiveModelCatalog } from "@/lib/ai/live-model-catalog";
import { getModelCapabilityProfile } from "@/lib/ai/model-capabilities";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
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