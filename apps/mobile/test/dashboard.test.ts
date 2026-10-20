import { describe, expect, it } from 'vitest';
import { budgetAlert, budgetStatus, calculateScenario, filterDashboardRows, summarizeCashFlow } from '../src/dashboard';

const row = (id: string, date: string, amount_minor = '1000') => ({
  id, user_id: 'user', game_account_id: 'account', character_id: null, category_id: null,
  transaction_type: 'expense' as const, classification: 'cash_payment' as const, state: 'posted' as const,
  amount_minor, currency: 'PHP', transaction_date: date, idempotency_key: id, revision: 0, reversal_of_id: null,
});

describe('dashboard calculators', () => {
  it('handles empty data without NaN or a false profit', () => {
    expect(summarizeCashFlow([]).kind).toBe('applicable');
    expect(budgetStatus(0n, 0n)).toBe('over');
  });
  it('labels budget thresholds exactly', () => {
    expect(budgetStatus(79n, 100n)).toBe('on_track');
    expect(budgetStatus(80n, 100n)).toBe('warning');
    expect(budgetStatus(100n, 100n)).toBe('over');
  });
  it('filters ledger data by date and account while preserving a cursor page', () => {
    const result = filterDashboardRows([row('a', '2026-01-02'), row('b', '2026-01-01'), row('c', '2025-12-31')], {
      accountId: 'account', from: '2026-01-01', to: '2026-01-02', limit: 1,
    });
    expect(result.rows.map(item => item.id)).toEqual(['a']);
    expect(result.nextCursor).toBe('a');
  });
  it('returns a conservative budget alert at the exact warning boundary', () => {
    expect(budgetAlert(80n, 100n)).toEqual({ status: 'warning', message: 'Budget warning: 80% used.' });
    expect(budgetAlert(100n, 100n).status).toBe('over');
  });
  it('keeps scenario output explicitly hypothetical', () => {
    const result = calculateScenario({
      recordedCashCosts: { amountMinor: 10_000n, currency: 'PHP' },
      previouslyRecoveredCash: { amountMinor: 2_000n, currency: 'PHP' },
      expectedSalePrice: { amountMinor: 12_000n, currency: 'PHP' },
      saleFeeBasisPoints: 500n,
      fixedFees: { amountMinor: 100n, currency: 'PHP' },
    });
    expect(result.kind).toBe('applicable');
    if (result.kind === 'applicable') expect(result.value.label).toBe('hypothetical');
  });
});
