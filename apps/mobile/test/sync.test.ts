import { describe, expect, it } from 'vitest';
import { syncPendingMutations, type SyncStore } from '../src/sync';
import type { SyncConflict, SyncMutation } from '@forgekeep/shared';

const mutation = (id: string, revision = 1): SyncMutation => ({ id, entityType: 'financial_transaction', entityId: `entity-${id}`, clientRevision: revision, payload: '{}', state: 'pending' });
function store(mutations: SyncMutation[]) {
  const applied: string[] = [], conflicts: SyncConflict[] = [], failed: string[] = [];
  const state: SyncStore = { pending: async () => mutations, markApplied: async id => { applied.push(id); }, markConflict: async conflict => { conflicts.push(conflict); }, markFailed: async id => { failed.push(id); } };
  return { state, applied, conflicts, failed };
}
describe('offline synchronization', () => {
  it('acknowledges duplicate retries exactly once', async () => { const memory = store([mutation('one')]); const result = await syncPendingMutations(memory.state, async item => ({ kind: 'duplicate', mutationId: item.id })); expect(result[0]?.kind).toBe('duplicate'); expect(memory.applied).toEqual(['one']); });
  it('keeps a server revision conflict visible without overwriting local state', async () => { const memory = store([mutation('two', 4)]); await syncPendingMutations(memory.state, async item => ({ kind: 'conflict', mutationId: item.id, serverRevision: 5, serverPayload: '{"amount_minor":"900"}' })); expect(memory.conflicts).toEqual([{ mutationId: 'two', entityId: 'entity-two', localRevision: 4, serverRevision: 5, serverPayload: '{"amount_minor":"900"}' }]); expect(memory.applied).toEqual([]); });
  it('marks network failures retryable instead of pretending they applied', async () => { const memory = store([mutation('three')]); const result = await syncPendingMutations(memory.state, async () => { throw new Error('offline'); }); expect(result).toEqual([{ kind: 'failed', mutationId: 'three' }]); expect(memory.failed).toEqual(['three']); });
});
