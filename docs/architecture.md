# ForgeKeep Wallet Architecture

## System shape

ForgeKeep Wallet is a pnpm TypeScript monorepo with an Android-first Expo client, a Next.js privileged API, and Supabase as the authentication, Postgres, and object-storage platform.

```text
apps/mobile ── authenticated RLS access ──> Supabase
     │                                         │
     ├── SQLite ledger projection/outbox        └── Postgres + Storage
     │
     └── privileged operations ──> apps/api ──> Supabase service access
                                      │
                                      ├── RevenueCat webhooks
                                      ├── report/export jobs
                                      └── signed receipt uploads
```

## Workspace boundaries

| Area | Responsibility |
| --- | --- |
| `apps/mobile` | Expo Router screens, NativeWind UI, SecureStore session persistence, SQLite cache/outbox, and accessible native interactions. |
| `apps/api` | Next.js Route Handlers for server-authoritative workflows and integrations. |
| `packages/financial-engine` | Platform-independent integer-money calculations and financial result types. |
| `packages/validators` | Shared Zod schemas for database-shaped and API/mobile boundary inputs. |
| `packages/database` | Prisma schema/client for trusted server use and generated Supabase database types. |
| `packages/shared` | Non-secret domain enums, shared query keys, and formatting contracts. |
| `supabase/migrations` | Source-of-truth SQL migrations for tables, constraints, RLS, indexes, and storage policies. |

## Access model

The mobile client receives only `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. It uses Supabase Auth and owner-scoped RLS for normal user records. The API holds server secrets and authenticates callers before privileged work. Prisma is server-only and must not bypass a user authorization decision merely because it can bypass RLS.

## Data and synchronization flow

The client writes a local validated mutation and its stable UUID/idempotency key to SQLite before attempting remote sync. A successful remote response updates the local projection; failures remain queued with a visible status. Revision conflicts are retained as conflict records and require an explicit user choice. Remote transactions are cursor-paginated and reconciled into the projection.

## Financial boundaries

UI and route handlers consume the shared financial engine; no screen owns its own financial formula. Realized cash values are derived from confirmed posted ledger entries only. Estimated values and projected outcomes are rendered as distinct, labeled result types.

## Growth boundaries

RevenueCat, report generation, equipment costing, and ForgeKeep account linking integrate through API/domain interfaces. No ForgeKeep endpoint is assumed until its authorization contract is confirmed. Redis, background workers beyond the deployment platform's capabilities, and microservices are excluded until a measured need exists.
