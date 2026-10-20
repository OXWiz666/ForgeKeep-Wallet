import { describe, expect, it } from 'vitest';
import { buildReversal, filterLedgerRows } from '../src/ledger';
import { hasDuplicateCharacter, retainArchivedCharacters } from '../src/portfolio';

const account = '11111111-1111-4111-8111-111111111111';
const character = '22222222-2222-4222-8222-222222222222';
const otherCharacter = '33333333-3333-4333-8333-333333333333';
const row = (id: string, date: string, state: 'posted' | 'reversed' = 'posted') => ({
  id, user_id: '99999999-9999-4999-8999-999999999999', game_account_id: account, character_id: character,
  category_id: null, transaction_type: 'expense' as const, classification: 'cash_payment' as const,
  state, amount_minor: '1000', currency: 'PHP', transaction_date: date, idempotency_key: id,
  revision: 2, reversal_of_id: null,
});

describe('portfolio and ledger workflows', () => {
  it('detects duplicate characters only within one account', () => {
    const rows = [{ id: character, game_account_id: account, ign: 'Knight' }, { id: otherCharacter, game_account_id: '44444444-4444-4444-8444-444444444444', ign: 'Knight' }];
    expect(hasDuplicateCharacter(rows, account, ' knight ')).toBe(true);
    expect(hasDuplicateCharacter(rows, '44444444-4444-4444-8444-444444444444', 'Knight', otherCharacter)).toBe(false);
  });

  it('retains archived characters for audit views', () => {
    const rows = [{ id: character, game_account_id: account, ign: 'Old', archived_at: '2026-01-01' }, { id: otherCharacter, game_account_id: account, ign: 'New', archived_at: null }];
    expect(retainArchivedCharacters(rows)).toHaveLength(2);
  });

  it('paginates filtered rows and creates a linked immutable reversal', () => {
    const rows = [row(character, '2026-01-01'), row(otherCharacter, '2026-01-02')];
    expect(filterLedgerRows(rows, { characterId: character, limit: 1 }).rows).toHaveLength(1);
    const reversal = buildReversal(rows[0], '55555555-5555-4555-8555-555555555555', '66666666-6666-4666-8666-666666666666', '2026-01-03');
    expect(reversal.type).toBe('adjustment');
    expect(reversal.amountMinor).toBe('-1000');
    expect(() => buildReversal(row(character, '2026-01-01', 'reversed'), reversal.id, reversal.idempotencyKey, '2026-01-04')).toThrow('only_posted');
  });
});
