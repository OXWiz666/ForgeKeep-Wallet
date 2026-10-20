import type { SyncConflict, SyncMutation } from '@forgekeep/shared';

export type SyncResponse =
  | { kind: 'applied'; mutationId: string }
  | { kind: 'duplicate'; mutationId: string }
  | { kind: 'conflict'; mutationId: string; serverRevision: number; serverPayload: string };

export type SyncStore = Readonly<{
  pending(): Promise<readonly SyncMutation[]>;
  markApplied(mutationId: string): Promise<void>;
  markConflict(conflict: SyncConflict): Promise<void>;
  markFailed(mutationId: string): Promise<void>;
}>;

export type SyncTransport = (mutation: SyncMutation) => Promise<SyncResponse>;

export async function syncPendingMutations(store: SyncStore, submit: SyncTransport) {
  const results: Array<SyncResponse | { kind: 'failed'; mutationId: string }> = [];
  for (const mutation of await store.pending()) {
    try {
      const response = await submit(mutation);
      if (response.kind === 'applied' || response.kind === 'duplicate') await store.markApplied(response.mutationId);
      else await store.markConflict({ mutationId: response.mutationId, entityId: mutation.entityId, localRevision: mutation.clientRevision, serverRevision: response.serverRevision, serverPayload: response.serverPayload });
      results.push(response);
    } catch {
      await store.markFailed(mutation.id);
      results.push({ kind: 'failed', mutationId: mutation.id });
    }
  }
  return results;
}
