# ForgeKeep Wallet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver an Android-first, offline-capable, multi-tenant MMORPG cash ledger with a real Supabase backend and shared exact financial calculations.

**Architecture:** A pnpm monorepo hosts an Expo mobile app, a Next.js privileged API, shared TypeScript packages, and Supabase SQL migrations. The mobile app uses Supabase Auth/RLS for ordinary owner-scoped records and SQLite for its offline projection/outbox; privileged operations remain server-side.

**Tech Stack:** TypeScript, pnpm workspaces, Expo, Expo Router, NativeWind, TanStack Query, Zustand, React Hook Form, Zod, Expo SQLite, Expo SecureStore, Next.js App Router, Supabase, Prisma, Vitest, and Playwright/Expo-compatible journey tests.

**Spec:** `docs/superpowers/specs/2026-10-20-forgekeep-wallet-design.md`

## Global Constraints

- Keep authoritative money as integer minor units; never use binary floating point for financial results.
- Use `packages/financial-engine` as the only implementation of cash-flow, ROI, break-even, budget, and scenario formulas.
- Enforce owner-scoped Supabase RLS for every exposed user table; no service-role secret is bundled with the mobile app.
- Use stable client UUIDs, idempotency keys, revisions, and explicit conflict records for sync writes.
- Preserve posted financial records with linked reversals/corrections; do not silently overwrite or physically delete them.
- Label estimates, scenarios, and hypothetical exits distinctly from realized values.
- Avoid game-specific business rules in core financial packages and avoid unmeasured infrastructure dependencies.

## Review Focus

- A replayed offline transaction must resolve idempotently and appear once in the ledger and dashboard.
- A malicious authenticated user must not read, update, or reassign another user's row or receipt object.
- A zero cost basis, zero recovery, or 100% fee must return a typed non-result rather than `Infinity`, `NaN`, or a false profit.
- A reversal or correction must keep the audit lineage while reconciling all relevant summaries.
- An unresolved version conflict must remain visible and must not overwrite either financial record.

---

## File Structure

| Path | Responsibility |
| --- | --- |
| `pnpm-workspace.yaml`, root config files | Workspace and shared quality tooling. |
| `apps/mobile` | Expo application, navigation, screens, local persistence, and accessible UI. |
| `apps/api` | Privileged Next.js route handlers and webhook/export boundaries. |
| `packages/financial-engine/src` | Exact money and pure result calculations. |
| `packages/validators/src` | Shared input schemas and inferred contracts. |
| `packages/database` | Prisma trusted-server access and generated Supabase types. |
| `supabase/migrations` | Applied SQL schema, constraints, RLS, and indexes. |
| `docs/*.md` | Product decisions and operational documentation. |

### Task 1: Bootstrap the workspace and quality gates

**Files:** Create root `package.json`, `pnpm-workspace.yaml`, TypeScript/ESLint/Prettier/Vitest configuration, `.gitignore`, `.env.example`, `apps/mobile`, `apps/api`, and all shared package manifests.

**Interfaces:** Produces workspace scripts `lint`, `typecheck`, `test`, `test:integration`, and `db:verify` used by all later tasks.

- [ ] Create a red workspace smoke test that imports `@forgekeep/financial-engine` from a consumer package.
- [ ] Run `pnpm test` and verify it fails because the package does not yet exist.
- [ ] Create the pnpm workspace and package manifests with pinned dependency versions and a committed lockfile.
- [ ] Run `pnpm lint`, `pnpm typecheck`, and `pnpm test`; verify the smoke test passes.
- [ ] Commit with `chore: bootstrap ForgeKeep workspace`.

### Task 2: Implement the financial engine with TDD

**Files:** Create `packages/financial-engine/src/money.ts`, `results.ts`, `cash-flow.ts`, `break-even.ts`, `scenarios.ts`, `index.ts`, and matching `*.test.ts` files.

**Interfaces:** Produces `Money`, `FinancialResult<T>`, `calculateCashFlow(entries)`, `calculateBreakEven(input)`, `calculateRealizedRoi(input)`, and `calculateHypotheticalExit(input)`.

- [ ] Write failing tests for integer minor-unit arithmetic, zero-denominator ROI, refunds, transfers, 100% fees, and positive/invalid break-even projections.
- [ ] Run the financial-engine test suite and verify each test fails against missing exports.
- [ ] Implement the declared interfaces with `bigint` arithmetic and typed applicable/not-applicable/not-possible results.
- [ ] Run the suite and verify all formula tests pass, including the Review Focus zero/100%-fee cases.
- [ ] Commit with `feat: add exact financial engine`.

### Task 3: Define shared validation and domain contracts

**Files:** Create `packages/shared/src/domain.ts`, `query-keys.ts`, `packages/validators/src/transaction.ts`, `portfolio.ts`, `sync.ts`, and tests.

**Interfaces:** Consumes `Money`; produces `CreateTransactionInput`, `ReverseTransactionInput`, `SyncMutationInput`, `TransactionState`, and inferred Zod types.

- [ ] Write failing schema tests for invalid currencies, zero posted amount, malformed UUID/idempotency keys, invalid state transitions, and unbalanced allocations.
- [ ] Implement schemas and shared enum contracts without duplicating financial-engine rules.
- [ ] Run package tests and type checks; verify invalid payloads are rejected at the boundary.
- [ ] Commit with `feat: add shared ledger contracts`.

### Task 4: Establish Supabase schema, RLS, and storage policy

**Files:** Create `supabase/config.toml`, a generated migration under `supabase/migrations`, RLS integration tests, Prisma schema/client configuration, and type-generation script.

**Interfaces:** Consumes shared ledger contracts; produces owner-scoped tables, `financial_transactions` idempotency guarantees, RLS policies, receipt storage bucket policies, and generated database types.

- [ ] Run `supabase migration new initial_wallet_schema` and write failing two-user authorization tests plus duplicate-idempotency tests.
- [ ] Implement tables, constraints, indexes, owner RLS policies, receipt object policy, and trusted-server Prisma mapping in the generated migration.
- [ ] Link the repository to project `olqusuzpxkcqnapxxmnn`, apply the migration, run database advisors, and fix advisor findings relevant to this schema.
- [ ] Run the integration suite against the linked project; verify tenant isolation, attempted ownership reassignment rejection, receipt path isolation, and one-row idempotent replay.
- [ ] Commit with `feat: add secure wallet database schema`.

### Task 5: Build the privileged API boundaries

**Files:** Create `apps/api/app/api/health/route.ts`, receipt-signing route, webhook route skeleton, auth middleware, server Supabase/Prisma clients, and route tests.

**Interfaces:** Produces authenticated route context, `POST /api/receipts/sign-upload`, and idempotent webhook-event persistence; consumes validated user identity and shared schemas.

- [ ] Write failing route tests for unauthenticated requests, foreign receipt paths, rejected file types/sizes, and duplicate webhook event IDs.
- [ ] Implement the route handlers with server-only environment access and Zod validation.
- [ ] Run API tests and verify secrets cannot be imported by client modules.
- [ ] Commit with `feat: add privileged API boundaries`.

### Task 6: Implement mobile authentication and app shell

**Files:** Create Expo Router layout/tabs, Supabase mobile client, SecureStore adapter, auth screens, query provider, theme/tokens, and component tests.

**Interfaces:** Produces authenticated session state, five-tab navigation, and accessible sign-in/sign-out flows.

- [ ] Write failing component tests for restored sessions, sign-out clearing secure state, and unauthenticated navigation guard.
- [ ] Implement email/password authentication and configuration-gated Google provider entry points; do not hardcode OAuth credentials.
- [ ] Run mobile tests and a development build smoke check; verify session tokens are not persisted in plain storage.
- [ ] Commit with `feat: add mobile auth and navigation shell`.

### Task 7: Implement portfolio profiles and ledger entry

**Files:** Create mobile portfolio/game-account/character repositories, transaction list/form screens, query hooks, and domain tests.

**Interfaces:** Consumes `CreateTransactionInput`; produces owner-scoped portfolio CRUD, cursor-paginated ledger queries, and linked reversal creation.

- [ ] Write failing tests for duplicate character detection per account, archive retention, filtered pagination, and correction lineage.
- [ ] Implement validated forms and repositories using RLS access, React Hook Form, and TanStack Query invalidation.
- [ ] Run mobile and integration tests; verify a posted entry cannot be silently modified and reversal totals reconcile.
- [ ] Commit with `feat: add portfolio and ledger workflows`.

### Task 8: Implement offline projection and synchronization

**Files:** Create SQLite schema, outbox repository, sync service, conflict screen/state, and sync tests.

**Interfaces:** Consumes `SyncMutationInput`; produces `enqueueMutation`, `syncPendingMutations`, and explicit `SyncConflict` records.

- [ ] Write failing tests for restart persistence, offline entry, duplicate retry, server acknowledgement, and revision conflict.
- [ ] Implement local projection/outbox writes before network attempts and deterministic reconciliation after responses.
- [ ] Run sync tests; verify the Review Focus replay and conflict scenarios neither duplicate nor overwrite records.
- [ ] Commit with `feat: add offline ledger synchronization`.

### Task 9: Deliver dashboards, budgets, and calculators

**Files:** Create summary query hooks, Home/Analytics screens, budget forms/alerts, scenario calculator, chart adapters, and component/engine integration tests.

**Interfaces:** Consumes financial-engine result types and owner-scoped ledger data; produces labeled realized, estimated, and hypothetical visual summaries.

- [ ] Write failing tests for empty data, applicable/not-applicable states, date/game/account/character filters, and budget-threshold calculations.
- [ ] Implement dashboard cards, date filters, accessible loading/empty/error states, and user-editable conservative/base/optimistic inputs.
- [ ] Run mobile tests and verify dashboard totals reconcile to the ledger query.
- [ ] Commit with `feat: add dashboard budgets and calculators`.

### Task 10: Add subscription, export, and future-module seams

**Files:** Create entitlement service, RevenueCat webhook handling, export job contracts, equipment/ForgeKeep feature interfaces, and tests.

**Interfaces:** Produces `EntitlementSnapshot`, idempotent webhook processing, read-only downgrade checks, and export-job state contracts.

- [ ] Write failing tests for duplicate webhook events, expired entitlements preserving records, essential-export allowance, and disabled ForgeKeep integration without a verified API.
- [ ] Implement server-verified entitlement persistence and feature gates; leave external provider credentials/configuration as environment requirements.
- [ ] Run API tests and verify client-supplied entitlement claims cannot unlock premium access.
- [ ] Commit with `feat: add entitlement and export foundations`.

### Task 11: Add CI, release verification, and operational docs

**Files:** Create GitHub Actions workflow, environment/setup documentation, runbook, and release checklist.

**Interfaces:** Consumes the workspace scripts; produces required CI checks for formatting, lint, types, unit tests, integration tests, migration validation, and security checks.

- [ ] Write a failing CI script test/check for missing required environment variable documentation and missing workspace commands.
- [ ] Implement CI and the deployment/runbook documentation for Supabase, EAS, and Sentry configuration boundaries.
- [ ] Run the full local command matrix and verify a clean checkout can execute it with documented configuration.
- [ ] Commit with `ci: add wallet quality gates`.

## Follow-on delivery boundaries

After the core ledger release is stable, create dedicated implementation plans for production RevenueCat product configuration, PDF/CSV rendering and asynchronous jobs, equipment/upgrade costing screens, full notification scheduling, Android EAS release automation, and any ForgeKeep API integration confirmed by its owning system. Each plan must preserve the financial-engine and RLS contracts established here.
