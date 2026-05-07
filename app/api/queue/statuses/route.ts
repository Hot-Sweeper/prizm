import { auth } from "@/auth";
import { getJobsByIdsForUser } from "@/lib/db/queries/jobs";
import { NextResponse } from "next/server";
import { z } from "zod";

const queueStatusesSchema = z.object({
  jobIds: z.array(z.string().min(1)).min(1).max(50),
});

const uuidSchema = z.string().uuid();

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = queueStatusesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const validJobIds: string[] = [];
  const invalidJobIds: string[] = [];

  for (const jobId of parsed.data.jobIds) {
    if (uuidSchema.safeParse(jobId).success) {
      validJobIds.push(jobId);
    } else {
      invalidJobIds.push(jobId);
    }
  }

  if (validJobIds.length === 0) {
    return NextResponse.json({ jobs: [], invalidJobIds });
  }

  const jobs = await getJobsByIdsForUser(session.user.id, validJobIds).catch(
    () => []
  );

  return NextResponse.json({
    jobs: jobs.map((job) => ({
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
    })),
    invalidJobIds,
  });
}
