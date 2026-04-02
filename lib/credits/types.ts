export type CreditType = "image" | "video";

export type TransactionReason =
  | "subscription_grant"
  | "generation_debit"
  | "cancellation_forfeit"
  | "admin_adjustment";

export interface CreditBalance {
  image: number;
  video: number;
}

export interface CreditHistoryEntry {
  id: string;
  creditType: CreditType;
  delta: number;
  reason: TransactionReason;
  stripeEventId: string | null;
  createdAt: Date;
}
