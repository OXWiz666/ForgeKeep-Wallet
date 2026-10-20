import { describe, expect, it } from 'vitest';
import { canExport, canUsePremium, entitlementFromRevenueCatEvent } from '../src/entitlements.js';

const user = '11111111-1111-4111-8111-111111111111';
describe('server-verified entitlements', () => {
  it('ignores client-shaped events without a verified UUID and entitlement', () => {
    expect(entitlementFromRevenueCatEvent({ id: 'e', type: 'INITIAL_PURCHASE', app_user_id: 'not-a-user', entitlement_ids: ['pro'] })).toBeNull();
  });
  it('preserves essential exports after expiry while denying premium access', () => {
    const snapshot = entitlementFromRevenueCatEvent({ id: 'e', type: 'EXPIRATION', app_user_id: user, entitlement_ids: ['pro'], expiration_at_ms: Date.now() - 1000 });
    expect(snapshot && canUsePremium(snapshot)).toBe(false);
    expect(canExport(snapshot)).toBe(true);
  });
});
