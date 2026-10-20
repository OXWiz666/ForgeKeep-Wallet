import { createCharacterSchema, type CreateCharacterInput } from '@forgekeep/validators';

export type CharacterRow = Readonly<{
  id: string; game_account_id: string; ign: string; ign_normalized?: string; archived_at?: string | null;
}>;

export function normalizeCharacterName(ign: string) {
  return ign.trim().toLocaleLowerCase();
}

export function hasDuplicateCharacter(rows: readonly CharacterRow[], gameAccountId: string, ign: string, exceptId?: string) {
  const normalized = normalizeCharacterName(ign);
  return rows.some(row => row.id !== exceptId && row.game_account_id === gameAccountId
    && normalizeCharacterName(row.ign_normalized ?? row.ign) === normalized);
}

export function parseCharacter(input: CreateCharacterInput) {
  return createCharacterSchema.parse(input);
}

export function retainArchivedCharacters(rows: readonly CharacterRow[]) {
  return [...rows].sort((a, b) => (b.archived_at ?? '').localeCompare(a.archived_at ?? ''));
}
