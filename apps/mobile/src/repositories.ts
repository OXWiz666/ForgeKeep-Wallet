import type { SupabaseClient } from '@supabase/supabase-js';
import { createCharacterSchema, createGameAccountSchema, createTransactionSchema, transactionFilterSchema, type CreateCharacterInput, type CreateGameAccountInput, type CreateTransactionInput, type TransactionFilter } from '@forgekeep/validators';
import { buildReversal, type LedgerRow } from './ledger';

function required<T>(data: T | null, error: { message: string } | null) {
  if (error) throw new Error(error.message);
  if (data === null) throw new Error('empty_response');
  return data;
}

export async function createGameAccount(client: SupabaseClient, input: CreateGameAccountInput) {
  const value = createGameAccountSchema.parse(input);
  const { data, error } = await client.from('game_accounts').insert({ id: value.id, game_id: value.gameId, display_name: value.displayName, server: value.server ?? null, region: value.region ?? null }).select().single();
  return required(data, error);
}

export async function createCharacter(client: SupabaseClient, input: CreateCharacterInput) {
  const value = createCharacterSchema.parse(input);
  const { data, error } = await client.from('characters').insert({ id: value.id, game_account_id: value.gameAccountId, ign: value.ign, class_name: value.className ?? null, level: value.level ?? null, combat_power: value.combatPower ?? null }).select().single();
  return required(data, error);
}

export async function archiveCharacter(client: SupabaseClient, characterId: string) {
  const { data, error } = await client.from('characters').update({ archived_at: new Date().toISOString() }).eq('id', characterId).select('id, archived_at').single();
  return required(data, error);
}

export async function listTransactions(client: SupabaseClient, rawFilter: TransactionFilter) {
  const filter = transactionFilterSchema.parse(rawFilter);
  let query = client.from('financial_transactions').select('*').order('transaction_date', { ascending: false }).order('id', { ascending: false }).limit(filter.limit);
  if (filter.accountId) query = query.eq('game_account_id', filter.accountId);
  if (filter.characterId) query = query.eq('character_id', filter.characterId);
  if (filter.categoryId) query = query.eq('category_id', filter.categoryId);
  if (filter.state) query = query.eq('state', filter.state);
  if (filter.from) query = query.gte('transaction_date', filter.from);
  if (filter.to) query = query.lte('transaction_date', filter.to);
  if (filter.cursor) query = query.lt('id', filter.cursor);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return { rows: (data ?? []) as LedgerRow[], nextCursor: data?.length === filter.limit ? data.at(-1)?.id ?? null : null };
}

export async function createTransaction(client: SupabaseClient, input: CreateTransactionInput) {
  const value = createTransactionSchema.parse(input);
  const { data, error } = await client.from('financial_transactions').insert({ id: value.id, idempotency_key: value.idempotencyKey, game_account_id: value.accountId, character_id: value.characterId ?? null, category_id: value.categoryId ?? null, transaction_type: value.type, classification: value.classification, state: value.state, amount_minor: value.amountMinor, currency: value.currency, transaction_date: value.transactionDate, revision: value.revision }).select().single();
  return required(data, error);
}

export async function reverseTransaction(client: SupabaseClient, original: LedgerRow, id: string, idempotencyKey: string, date: string) {
  return createTransaction(client, buildReversal(original, id, idempotencyKey, date));
}
