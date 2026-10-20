import { describe, expect, it } from 'vitest';
import { budgetStatus, summarizeCashFlow } from '../src/dashboard';

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
});
