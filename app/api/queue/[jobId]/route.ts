import { auth } from "@/auth";
import { db } from "@/lib/db";
import { generationJobs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { jobId } = await params;

  const job = await db.query.generationJobs.findFirst({
    where: eq(generationJobs.id, jobId),
    columns: {
      id: true,
      status: true,
      type: true,
      modelId: true,
      prompt: true,
      resultUrl: true,
      errorMessage: true,
      creditCost: true,
      createdAt: true,
      updatedAt: true,
      userId: true,
    },
  });

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  // Prevent accessing another user's job
  if (job.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    id: job.id,
    status: job.status,
    type: job.type,
    modelId: job.modelId,
    prompt: job.prompt,
    resultUrl: job.resultUrl,
    errorMessage: job.errorMessage,
    creditCost: job.creditCost,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  });
}
