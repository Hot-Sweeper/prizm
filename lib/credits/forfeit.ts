import "server-only";
import { db } from "@/lib/db";
import { creditLedger } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

/** Forfeits all remaining credits for a user. Called on subscription cancellation. */
export async function forfeitAllCredits(userId: string): Promise<void> {
  await db.transaction(async (tx) => {
    const balances = await tx
      .select({
        creditType: creditLedger.creditType,
        total: sql<number>`COALESCE(SUM(${creditLedger.delta}), 0)`,
      })
      .from(creditLedger)
      .where(eq(creditLedger.userId, userId))
      .groupBy(creditLedger.creditType);

    const inserts = balances
      .filter((b) => b.total > 0)
      .map((b) =>
        tx.insert(creditLedger).values({
          userId,
          creditType: b.creditType,
          delta: -b.total,
          reason: "cancellation_forfeit",
        })
      );

    await Promise.all(inserts);
  });
}
