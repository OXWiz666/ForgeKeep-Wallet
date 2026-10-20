import { createTransactionSchema, type CreateTransactionInput, type TransactionFilter } from '@forgekeep/validators';

export type LedgerRow = Readonly<{
  id: string; user_id: string; game_account_id: string; character_id: string | null; category_id: string | null;
  transaction_type: CreateTransactionInput['type']; classification: CreateTransactionInput['classification'];
  state: CreateTransactionInput['state']; amount_minor: number | string; currency: string;
  transaction_date: string; idempotency_key: string; revision: number; reversal_of_id: string | null;
}>;

export type LedgerPage = Readonly<{ rows: readonly LedgerRow[]; nextCursor: string | null }>;

export function buildReversal(original: LedgerRow, id: string, idempotencyKey: string, transactionDate: string): CreateTransactionInput {
  if (original.state !== 'posted') throw new Error('only_posted_transactions_can_be_reversed');
  return createTransactionSchema.parse({
    id, idempotencyKey, accountId: original.game_account_id, characterId: original.character_id ?? undefined,
    categoryId: original.category_id ?? undefined, type: 'adjustment', classification: original.classification,
    state: 'posted', amountMinor: `-${original.amount_minor}`, currency: original.currency,
    transactionDate, revision: original.revision + 1,
  });
}

export function filterLedgerRows(rows: readonly LedgerRow[], filter: TransactionFilter): LedgerPage {
  const filtered = rows.filter(row => (!filter.accountId || row.game_account_id === filter.accountId)
    && (!filter.characterId || row.character_id === filter.characterId)
    && (!filter.categoryId || row.category_id === filter.categoryId)
    && (!filter.state || row.state === filter.state)
    && (!filter.from || row.transaction_date >= filter.from)
    && (!filter.to || row.transaction_date <= filter.to));
  const cursorIndex = filter.cursor ? filtered.findIndex(row => row.id === filter.cursor) : -1;
  const page = filtered.slice(cursorIndex + 1, cursorIndex + 1 + filter.limit);
  return { rows: page, nextCursor: page.length === filter.limit ? page.at(-1)!.id : null };
}
