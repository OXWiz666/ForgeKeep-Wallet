export const transactionTypes = ["expense", "income", "transfer", "adjustment"] as const;
export const transactionClassifications = ["cash_payment", "cash_receipt", "refund", "reimbursement", "asset_disposal", "internal_transfer"] as const;
export const transactionStates = ["draft", "posted", "reversed"] as const;
