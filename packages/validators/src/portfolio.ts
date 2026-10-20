import { z } from 'zod';

export const createGameAccountSchema = z.object({
  id: z.uuid(), gameId: z.uuid(), displayName: z.string().trim().min(1).max(120),
  server: z.string().trim().max(120).optional(), region: z.string().trim().max(80).optional(),
});

export const createCharacterSchema = z.object({
  id: z.uuid(), gameAccountId: z.uuid(), ign: z.string().trim().min(1).max(120),
  className: z.string().trim().max(80).optional(), level: z.number().int().nonnegative().optional(),
  combatPower: z.string().regex(/^\d+$/).optional(),
});

export const transactionFilterSchema = z.object({
  accountId: z.uuid().optional(), characterId: z.uuid().optional(), categoryId: z.uuid().optional(),
  state: z.enum(['draft', 'posted', 'reversed']).optional(),
  from: z.iso.date().optional(), to: z.iso.date().optional(),
  cursor: z.uuid().optional(), limit: z.number().int().min(1).max(100).default(50),
});

export type CreateGameAccountInput = z.infer<typeof createGameAccountSchema>;
export type CreateCharacterInput = z.infer<typeof createCharacterSchema>;
export type TransactionFilter = z.infer<typeof transactionFilterSchema>;
