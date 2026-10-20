# ForgeKeep Wallet Database Design

## Ownership and identifiers

All tenant-owned rows use UUID primary keys and include `user_id uuid not null references auth.users(id)`. The authenticated user owns game accounts, characters, categories, ledger records, budgets, scenarios, receipt metadata, and sync mutations. Foreign keys use restrictive behavior where deleting a parent would destroy posted financial history; archive flags replace destructive deletion for portfolio entities.

## Initial tables

| Table | Purpose |
| --- | --- |
| `user_settings` | Currency, locale, timezone, notification, and lock preferences. |
| `games` | Built-in or user-created game metadata. |
| `game_accounts` | User-owned accounts within a game and region/server. |
| `characters` | Character profiles under game accounts; archive state preserves history. |
| `transaction_categories` | System and user-owned income/expense categories. |
| `financial_transactions` | Immutable posted ledger entries, drafts, reversals, and corrections. |
| `transaction_allocations` | Explicit allocation where one cash transaction belongs to more than one supported target. |
| `character_valuations` | Dated, explicitly estimated character-value snapshots. |
| `budgets` | User-defined total, game, character, or category period limits. |
| `financial_scenarios` | User-editable conservative/base/optimistic assumptions. |
| `receipt_attachments` | Owner-scoped storage metadata, not binary contents. |
| `sync_mutations` | Idempotency/revision reconciliation evidence. |
| `audit_events` | Minimal action metadata without sensitive values or token data. |
| `subscription_customers`, `subscription_entitlements`, `subscription_events` | Server-verified RevenueCat state and idempotent webhook records. |

Equipment and upgrade logs, report jobs, and ForgeKeep links are additive migrations once their dependent workflows are implemented.

## Ledger shape

`financial_transactions` stores: immutable transaction UUID, owner, game account, optional character, category, transaction type, cash classification, posting state, signed amount in minor units, ISO currency, optional reporting-currency amount/rate snapshot, transaction date, description, parent/reversal transaction reference, client revision, idempotency key, created/updated timestamps, and sync timestamps.

Amounts are signed only at the domain boundary according to type/classification; check constraints prevent impossible states. A posted transaction cannot be changed in a way that alters its financial effect. Corrections create compensating records linked to the original. `internal_transfer` entries require balanced allocations and are excluded from portfolio-wide cash totals.

## Integrity and indexes

- Unique `(user_id, idempotency_key)` on client-originated writes.
- Unique active character identity in an account using the normalized IGN key.
- Check constraints for valid currency code format, non-negative revisions, valid posting transitions, and nonzero posted amounts.
- Index transaction filtering by `(user_id, transaction_date desc, id)` and scoped filters by account, character, category, and posted state.
- Index pending sync mutations by `(user_id, state, created_at)`.
- Use cursor pagination based on the indexed date-and-ID tuple rather than offsets.

## RLS and storage

RLS is enabled for all exposed user tables. Policies use `TO authenticated` with `(select auth.uid()) = user_id`; update policies also use the same predicate in `WITH CHECK`. Reference tables expose only intentionally public read access. Receipt object paths begin with the authenticated user's UUID and storage policies validate that prefix. Tables and storage policies are verified with two-user isolation tests.
