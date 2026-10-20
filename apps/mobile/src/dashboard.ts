import { calculateCashFlow, calculateHypotheticalExit, money, type CashFlowEntry, type FinancialResult, type HypotheticalExitInput } from '@forgekeep/financial-engine';
import type { TransactionFilter } from '@forgekeep/validators';
import { filterLedgerRows, type LedgerPage, type LedgerRow } from './ledger';

export type BudgetStatus = 'on_track' | 'warning' | 'over';
export function budgetStatus(spentMinor: bigint, budgetMinor: bigint, warningBasisPoints = 8_000n): BudgetStatus {
  if (budgetMinor <= 0n) return 'over';
  if (spentMinor * 10_000n >= budgetMinor * 10_000n) return 'over';
  return spentMinor * 10_000n >= budgetMinor * warningBasisPoints ? 'warning' : 'on_track';
}

export function budgetAlert(spentMinor: bigint, budgetMinor: bigint, warningBasisPoints = 8_000n) {
  const status = budgetStatus(spentMinor, budgetMinor, warningBasisPoints);
  if (status === 'over') return { status, message: 'Budget exceeded.' } as const;
  if (status === 'warning') return { status, message: `Budget warning: ${(spentMinor * 100n) / budgetMinor}% used.` } as const;
  return { status, message: 'Budget on track.' } as const;
}

export function filterDashboardRows(rows: readonly LedgerRow[], filter: TransactionFilter): LedgerPage {
  return filterLedgerRows(rows, filter);
}

export function calculateScenario(input: HypotheticalExitInput): FinancialResult<Readonly<{
  label: 'hypothetical';
  netSaleProceeds: ReturnType<typeof money>;
  hypotheticalExitProfit: ReturnType<typeof money>;
}>> {
  return calculateHypotheticalExit(input);
}

export function summarizeCashFlow(entries: readonly CashFlowEntry[], currency = 'PHP') {
  return calculateCashFlow(entries.length ? entries : [{ classification: 'internal_transfer', state: 'posted', money: money(0n, currency) }]);
}
