import "server-only";
import { db } from "@/lib/db";
import { generationJobs } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

const PAGE_SIZE = 20;

export async function getUserJobs(userId: string, page = 1) {
  const offset = (page - 1) * PAGE_SIZE;

  return db.query.generationJobs.findMany({
    where: eq(generationJobs.userId, userId),
    orderBy: [desc(generationJobs.createdAt)],
    limit: PAGE_SIZE,
    offset,
    columns: {
      id: true,
      type: true,
      status: true,
      modelId: true,
      prompt: true,
      resultUrl: true,
      errorMessage: true,
      creditCost: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function getJobById(jobId: string) {
  return db.query.generationJobs.findFirst({
    where: eq(generationJobs.id, jobId),
  });
}
