# ForgeKeep Wallet design

**Date:** 2026-10-20  
**Status:** Approved for implementation planning

## Purpose and success criteria

ForgeKeep Wallet is an Android-first, offline-capable financial-management application for MMORPG players. It records actual cash payments and receipts across games, game accounts, and characters, and reports realized results separately from estimated values or projections.

The initial release succeeds when an authenticated user can safely maintain a multi-game portfolio, enter and correct cash transactions while offline, synchronize them without duplication, understand core cash-flow, budget, ROI, and break-even results, and retain strict isolation from every other user. Financial calculations must be exact for the supported currency conventions and must never present hypothetical value as realized profit.

## Architecture

The repository is a pnpm monorepo:

```text
apps/
  mobile/                  Expo Router mobile app
  api/                     Next.js App Router privileged API
packages/
  financial-engine/        Pure calculation and money domain logic
  validators/              Shared Zod schemas
  database/                Prisma client and Supabase type integration
  shared/                  Cross-platform domain types and constants
  config/                  Shared tooling configuration
supabase/
  migrations/              SQL schema, RLS, indexes, and storage policies
docs/
```

The mobile application directly uses Supabase Auth and RLS-protected data access for ordinary user-owned records. Expo SQLite contains a local projection and durable mutation outbox, allowing the ledger to remain usable without a network connection. TanStack Query owns server-state caching and invalidation; Zustand is limited to transient UI state.

The Next.js API is reserved for operations that require privileged credentials or server authority: RevenueCat webhook processing, entitlement evaluation, long-running report/export work, signed receipt-upload flows, and administrative tasks. Service-role credentials are server-only. The mobile app receives only the Supabase URL and publishable key.

Supabase SQL migrations are the schema source of truth. Prisma is used for typed, server-side privileged database work and remains aligned to the applied migration history. There is no separate microservice or Redis layer in the initial release.

## Authentication, privacy, and authorization

Supabase Auth supports email/password at launch. Google sign-in is integrated behind an enabled-provider configuration and documented redirect URI, so it activates once Google OAuth credentials are configured. Sessions are persisted only in Expo SecureStore. An optional biometric lock gates local app access but does not substitute for server authorization.

Every user-owned row carries a user identifier referencing `auth.users`. All publicly exposed tables enable RLS. Policies explicitly scope `SELECT`, `INSERT`, `UPDATE`, and `DELETE` to the current authenticated owner, and update policies use both `USING` and `WITH CHECK` predicates so ownership cannot be reassigned. User-editable JWT metadata is not used for authorization.

Receipt storage uses owner-scoped object paths, validated content types and size limits, and short-lived signed upload URLs. Logs and audit events contain identifiers and action metadata only; they never record access tokens, receipt contents, or financial descriptions. Account export and deletion are explicit, authenticated operations.

## Data model and ledger rules

The initial normalized model includes user settings, games, game accounts, characters, character valuations, transaction categories, financial transactions, equipment, equipment upgrade logs, budgets, financial scenarios, receipt attachments, sync mutations, audit events, and subscription/entitlement records. The migration only creates a table when it supports a released flow; later modules are additive.

`financial_transactions` is the ledger of record. Each transaction has a stable UUID, user, account, optional character, category, type, classification, posting state, amount in currency minor units, ISO currency, reporting-currency snapshot, transaction date, idempotency key, client revision, timestamps, and optional parent/reversal reference.

The supported transaction types are `expense`, `income`, `transfer`, and `adjustment`. Classification makes cash treatment explicit: `cash_payment`, `cash_receipt`, `refund`, `asset_disposal`, `reimbursement`, and `internal_transfer`. Posted ledger entries are never silently deleted or overwritten. A correction creates a linked compensating/reversing entry. Archived game accounts or characters remain available for ledger traceability.

Unique idempotency constraints and client-generated IDs prevent duplicate writes. Composite indexes support owner-scoped, cursor-paginated transaction queries filtered by account, character, category, state, and date.

## Financial engine

`packages/financial-engine` is a pure TypeScript package and the sole source of cash-flow, realized ROI, break-even, hypothetical exit, spending velocity, and budget calculations. Presentation components never contain formulas.

Money is represented as integers in minor units plus an ISO currency and currency exponent. Authoritative calculations do not use JavaScript binary floating point. The engine defines rounding at each conversion and output boundary, preserves exchange-rate snapshots, and returns typed `not_applicable` results for zero denominators, invalid fee configurations, or non-positive recovery projections.

Realized cash flow includes only actual posted cash payments and confirmed cash receipts. Estimated account value, unsold equipment value, in-game currency without an explicit valuation basis, listings, and projections are excluded from realized results. Hypothetical sale calculations are explicitly labeled as hypothetical. Transfers and allocation rules prevent double counting across accounts, characters, and equipment.

## Mobile experience and synchronization

The default interface uses a dark, accessible financial/MMORPG visual language with five tabs: Home, Transactions, Portfolio, Analytics, and Profile. A prominent quick-add flow creates validated expenses and income. The first implementation increment includes authentication, portfolio hierarchy, ledger entry/correction, cached dashboard summaries, budgets, and break-even/ROI views. Equipment costing, reports, subscriptions, and optional ForgeKeep linking are independent follow-on modules, not nonfunctional placeholder screens.

Each local mutation has a client-generated UUID, idempotency key, revision, operation type, and sync state. On reconnection, the app sends the queued operation, acknowledges the server result, and reconciles its local projection. Conflicting revisions become visible conflict records requiring explicit resolution; the system never overwrites a financial record silently. The UI communicates pending, synced, offline, conflict, loading, empty, and retry states accessibly.

## Subscription and operational boundaries

RevenueCat is the subscription authority, but the application trusts server-verified webhook events rather than client assertions. Webhook deliveries are idempotent and update entitlement history. Prices, tiers, and account limits are configuration, not financial-engine logic. On entitlement expiry, records are preserved and essential export remains available; premium operations follow an explicit read-only/unavailable downgrade policy.

Reports and large exports run as background server jobs when needed. ForgeKeep account linking is not implemented until a supported authorization flow and profile API are confirmed; no financial data is shared by default.

## Testing and release checks

Tests begin at the financial-engine boundary: zero values, refunds, adjustments, reversals, transfers, partial/full sales, minor-unit rounding, 100% fees, duplicates, and undefined ROI/break-even states. Integration coverage verifies database constraints, RLS tenant isolation, validation, idempotent writes, sync conflicts, and entitlement webhook handling. Mobile tests cover the critical authentication, ledger, offline-entry, and sync journeys.

Continuous integration runs formatting, linting, TypeScript checks, unit/integration tests, migration validation, and security checks. Before each remote schema change, the project runs database advisors and verifies the applied migration against the real Supabase project.

## Out of scope for the first increment

The first increment does not create unauthorized real-money-trading automation, automatic valuation of in-game items, production Google OAuth credentials, RevenueCat products, or ForgeKeep endpoints. It provides the interfaces and configurations those later verified integrations require.
