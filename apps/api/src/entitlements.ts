import { z } from 'zod';

const uuid = z.uuid();
const eventDetails = z.object({
  id: z.string().min(1), type: z.string().min(1), app_user_id: z.string().optional(),
  entitlement_ids: z.array(z.string().min(1)).optional(), expiration_at_ms: z.number().int().positive().nullable().optional(),
});
export type EntitlementSnapshot = Readonly<{ userId: string; entitlementId: string; status: 'active' | 'expired' | 'revoked'; expiresAt: Date | null; sourceEventId: string }>;

export function entitlementFromRevenueCatEvent(event: unknown): EntitlementSnapshot | null {
  const parsed = eventDetails.safeParse(event);
  if (!parsed.success || !parsed.data.app_user_id || !uuid.safeParse(parsed.data.app_user_id).success) return null;
  const type = parsed.data.type.toUpperCase();
  const status = type.includes('REVOKE') ? 'revoked' : type.includes('EXPIR') ? 'expired' : 'active';
  const entitlementId = parsed.data.entitlement_ids?.[0];
  if (!entitlementId) return null;
  return { userId: parsed.data.app_user_id, entitlementId, status, expiresAt: parsed.data.expiration_at_ms ? new Date(parsed.data.expiration_at_ms) : null, sourceEventId: parsed.data.id };
}

export function canUsePremium(snapshot: EntitlementSnapshot | null, now = new Date()) {
  return Boolean(snapshot?.status === 'active' && (!snapshot.expiresAt || snapshot.expiresAt > now));
}

export function canExport(snapshot: EntitlementSnapshot | null) {
  return true;
}
