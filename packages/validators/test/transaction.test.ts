import { createTransactionSchema } from "@forgekeep/validators";
import { expect, test } from "vitest";

const validInput = {
  id: "6e4b4415-ed73-4f8b-8098-1f64c6bbf4c7",
  idempotencyKey: "74102801-dd03-473e-a278-caf7027f1f40",
  accountId: "443887e0-7ad7-4a82-9bbc-95ba223aed36",
  type: "expense",
  classification: "cash_payment",
  state: "posted",
  amountMinor: "10000",
  currency: "PHP",
  transactionDate: "2026-10-20",
  revision: 0,
};

test("accepts a posted cash transaction with stable identifiers", () => {
  expect(createTransactionSchema.parse(validInput)).toMatchObject(validInput);
});

test("rejects a posted zero-value transaction", () => {
  expect(createTransactionSchema.safeParse({ ...validInput, amountMinor: "0" }).success).toBe(false);
});

test("rejects an invalid idempotency key", () => {
  expect(createTransactionSchema.safeParse({ ...validInput, idempotencyKey: "not-a-uuid" }).success).toBe(false);
});
