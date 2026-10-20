import { calculateCashFlow, type CashFlowEntry } from '@forgekeep/financial-engine';
import { money } from '@forgekeep/financial-engine';

export type BudgetStatus = 'on_track' | 'warning' | 'over';
export function budgetStatus(spentMinor: bigint, budgetMinor: bigint, warningBasisPoints = 8_000n): BudgetStatus {
  if (budgetMinor <= 0n) return 'over';
  if (spentMinor * 10_000n >= budgetMinor * 10_000n) return 'over';
  return spentMinor * 10_000n >= budgetMinor * warningBasisPoints ? 'warning' : 'on_track';
}

export function summarizeCashFlow(entries: readonly CashFlowEntry[], currency = 'PHP') {
  return calculateCashFlow(entries.length ? entries : [{ classification: 'internal_transfer', state: 'posted', money: money(0n, currency) }]);
}
