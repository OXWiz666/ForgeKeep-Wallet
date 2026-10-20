export const transactionTypes = ["expense", "income", "transfer", "adjustment"] as const;
export const transactionClassifications = ["cash_payment", "cash_receipt", "refund", "reimbursement", "asset_disposal", "internal_transfer"] as const;
export const transactionStates = ["draft", "posted", "reversed"] as const;

export type SyncMutationState = "pending" | "applied" | "conflict" | "failed";
export type SyncMutation = Readonly<{
  id: string; entityType: "financial_transaction"; entityId: string; clientRevision: number; payload: string; state: SyncMutationState;
}>;
export type SyncConflict = Readonly<{
  mutationId: string; entityId: string; localRevision: number; serverRevision: number; serverPayload: string;
}>;
