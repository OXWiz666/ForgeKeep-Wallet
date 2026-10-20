import { describe, expect, it } from 'vitest';
import { createCharacterSchema, transactionFilterSchema } from '../src/portfolio.js';

const uuid = '11111111-1111-4111-8111-111111111111';

describe('portfolio contracts', () => {
  it('rejects a blank character name and invalid level', () => {
    expect(createCharacterSchema.safeParse({ id: uuid, gameAccountId: uuid, ign: ' ', level: -1 }).success).toBe(false);
  });

  it('bounds cursor pagination and normalizes optional filters', () => {
    expect(transactionFilterSchema.parse({ limit: 25 })).toEqual({ limit: 25 });
    expect(transactionFilterSchema.safeParse({ limit: 101 }).success).toBe(false);
  });
});
