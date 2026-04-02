import "server-only";
import { db } from "@/lib/db";
import { creditLedger } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";

interface DeductCreditsParams {
  userId: string;
  creditType: "image" | "video";
  amount: number;
  jobId: string;
}

interface DeductResult {
  success: boolean;
  newBalance: number;
}

/**
 * Atomically deducts credits within a DB transaction with a FOR UPDATE lock.
 * Prevents race conditions where two simultaneous requests both see enough credits.
 */
export async function deductCredits(
  params: DeductCreditsParams
): Promise<DeductResult> {
  return db.transaction(async (tx) => {
    // Lock rows for this user+type during the transaction to prevent concurrent deductions
    const balanceResult = await tx
      .select({
        balance: sql<number>`COALESCE(SUM(${creditLedger.delta}), 0)`,
      })
      .from(creditLedger)
      .where(
        and(
          eq(creditLedger.userId, params.userId),
          eq(creditLedger.creditType, params.creditType)
        )
      )
      .for("update");

    const currentBalance = balanceResult[0]?.balance ?? 0;

    if (currentBalance < params.amount) {
      return { success: false, newBalance: currentBalance };
    }

    await tx.insert(creditLedger).values({
      userId: params.userId,
      creditType: params.creditType,
      delta: -params.amount,
      reason: "generation_debit",
      jobId: params.jobId,
    });

    return { success: true, newBalance: currentBalance - params.amount };
  });
}
