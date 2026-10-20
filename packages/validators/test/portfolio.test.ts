import { describe, expect, it } from 'vitest';
import { budgetSchema, createCharacterSchema, scenarioSchema, transactionFilterSchema } from '../src/portfolio.js';

const uuid = '11111111-1111-4111-8111-111111111111';

describe('portfolio contracts', () => {
  it('rejects a blank character name and invalid level', () => {
    expect(createCharacterSchema.safeParse({ id: uuid, gameAccountId: uuid, ign: ' ', level: -1 }).success).toBe(false);
  });

  it('bounds cursor pagination and normalizes optional filters', () => {
    expect(transactionFilterSchema.parse({ limit: 25 })).toEqual({ limit: 25 });
    expect(transactionFilterSchema.safeParse({ limit: 101 }).success).toBe(false);
  });

  it('rejects inverted budget periods and fee rates above 100 percent', () => {
    expect(budgetSchema.safeParse({ id: uuid, name: 'Monthly', amountMinor: '100', currency: 'PHP', periodStart: '2026-02-01', periodEnd: '2026-01-01' }).success).toBe(false);
    expect(scenarioSchema.safeParse({ id: uuid, name: 'Base', recordedCashCostsMinor: '100', previouslyRecoveredCashMinor: '0', expectedSalePriceMinor: '100', saleFeeBasisPoints: '10001', fixedFeesMinor: '0', currency: 'PHP' }).success).toBe(false);
  });
});
