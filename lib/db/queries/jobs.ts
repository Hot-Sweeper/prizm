import "server-only";
import { db } from "@/lib/db";
import { generationJobs } from "@/lib/db/schema";
import { eq, desc, and, inArray } from "drizzle-orm";

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

export async function getJobsByIdsForUser(userId: string, jobIds: string[]) {
  if (jobIds.length === 0) return [];

  return db.query.generationJobs.findMany({
    where: and(
      eq(generationJobs.userId, userId),
      inArray(generationJobs.id, jobIds)
    ),
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
