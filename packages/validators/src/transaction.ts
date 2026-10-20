import { z } from "zod";

export const createTransactionSchema = z.object({
  id: z.uuid(),
  idempotencyKey: z.uuid(),
  accountId: z.uuid(),
  characterId: z.uuid().optional(),
  categoryId: z.uuid().optional(),
  type: z.enum(["expense", "income", "transfer", "adjustment"]),
  classification: z.enum(["cash_payment", "cash_receipt", "refund", "reimbursement", "asset_disposal", "internal_transfer"]),
  state: z.enum(["draft", "posted", "reversed"]),
  amountMinor: z.string().regex(/^-?[1-9]\d*$/),
  currency: z.string().regex(/^[A-Z]{3}$/),
  transactionDate: z.iso.date(),
  revision: z.int().nonnegative(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
