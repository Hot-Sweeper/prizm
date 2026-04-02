import "server-only";
import { db } from "@/lib/db";
import { creditLedger } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import type { CreditBalance, CreditHistoryEntry } from "./types";

export async function getBalances(userId: string): Promise<CreditBalance> {
  const rows = await db
    .select({
      creditType: creditLedger.creditType,
      balance: sql<number>`COALESCE(SUM(${creditLedger.delta}), 0)`,
    })
    .from(creditLedger)
    .where(eq(creditLedger.userId, userId))
    .groupBy(creditLedger.creditType);

  return {
    image: rows.find((r) => r.creditType === "image")?.balance ?? 0,
    video: rows.find((r) => r.creditType === "video")?.balance ?? 0,
  };
}

export async function getCreditHistory(
  userId: string,
  limit = 20
): Promise<CreditHistoryEntry[]> {
  const rows = await db.query.creditLedger.findMany({
    where: eq(creditLedger.userId, userId),
    orderBy: (t, { desc }) => [desc(t.createdAt)],
    limit,
    columns: {
      id: true,
      creditType: true,
      delta: true,
      reason: true,
      stripeEventId: true,
      createdAt: true,
    },
  });

  return rows as CreditHistoryEntry[];
}
