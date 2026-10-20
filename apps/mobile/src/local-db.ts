import * as SQLite from 'expo-sqlite';
import type { SyncConflict, SyncMutation, SyncMutationState } from '@forgekeep/shared';

export class SqliteOutbox {
  private readonly db: SQLite.SQLiteDatabase;

  constructor(databaseName = 'forgekeep-wallet.db') {
    this.db = SQLite.openDatabaseSync(databaseName);
    this.db.execSync(`CREATE TABLE IF NOT EXISTS sync_mutations (id TEXT PRIMARY KEY NOT NULL, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL, client_revision INTEGER NOT NULL, payload TEXT NOT NULL, state TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP); CREATE TABLE IF NOT EXISTS sync_conflicts (mutation_id TEXT PRIMARY KEY NOT NULL, entity_id TEXT NOT NULL, local_revision INTEGER NOT NULL, server_revision INTEGER NOT NULL, server_payload TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);`);
  }

  enqueue(mutation: Omit<SyncMutation, 'state'>) {
    this.db.runSync('INSERT OR IGNORE INTO sync_mutations (id, entity_type, entity_id, client_revision, payload, state) VALUES (?, ?, ?, ?, ?, ?)', mutation.id, mutation.entityType, mutation.entityId, mutation.clientRevision, mutation.payload, 'pending');
  }
  pending() { return Promise.resolve(this.db.getAllSync<SyncMutation>("SELECT id, entity_type as entityType, entity_id as entityId, client_revision as clientRevision, payload, state FROM sync_mutations WHERE state = 'pending' ORDER BY created_at, id")); }
  markApplied(id: string) { this.db.runSync("UPDATE sync_mutations SET state = 'applied' WHERE id = ?", id); return Promise.resolve(); }
  markFailed(id: string) { this.db.runSync("UPDATE sync_mutations SET state = 'failed' WHERE id = ?", id); return Promise.resolve(); }
  markConflict(conflict: SyncConflict) { this.db.runSync("UPDATE sync_mutations SET state = 'conflict' WHERE id = ?", conflict.mutationId); this.db.runSync('INSERT OR REPLACE INTO sync_conflicts (mutation_id, entity_id, local_revision, server_revision, server_payload) VALUES (?, ?, ?, ?, ?)', conflict.mutationId, conflict.entityId, conflict.localRevision, conflict.serverRevision, conflict.serverPayload); return Promise.resolve(); }
  state(id: string) { return this.db.getFirstSync<{ state: SyncMutationState }>('SELECT state FROM sync_mutations WHERE id = ?', id)?.state ?? null; }
}
