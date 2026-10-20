import { addMoney, money, type Money, subtractMoney } from "./money";
import type { Applicable } from "./results";

export type CashClassification = "cash_payment" | "cash_receipt" | "refund" | "reimbursement" | "asset_disposal" | "internal_transfer";
export type PostingState = "draft" | "posted" | "reversed";
export type CashFlowEntry = Readonly<{ classification: CashClassification; money: Money; state: PostingState }>;

export type CashFlow = Readonly<{ payments: Money; receipts: Money; netCashFlow: Money }>;

export const calculateCashFlow = (entries: readonly CashFlowEntry[]): Applicable<CashFlow> => {
  const currency = entries[0]?.money.currency ?? "XXX";
  let payments = money(0n, currency);
  let receipts = money(0n, currency);

  for (const entry of entries) {
    if (entry.state !== "posted" || entry.classification === "internal_transfer") continue;
    if (entry.classification === "cash_payment") payments = addMoney(payments, entry.money);
    if (entry.classification === "cash_receipt" || entry.classification === "asset_disposal") receipts = addMoney(receipts, entry.money);
    if (entry.classification === "refund" || entry.classification === "reimbursement") payments = subtractMoney(payments, entry.money);
  }

  return { kind: "applicable", value: { payments, receipts, netCashFlow: subtractMoney(receipts, payments) } };
};
