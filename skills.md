# ForgeKeep Wallet engineering skills

This repository is an Android-first MMORPG financial ledger. Treat financial
records and user ownership as sensitive by default.

## Required practices

- Keep monetary values as integer minor units and put financial formulas only
  in `packages/financial-engine`.
- Write a failing test before production code, then run the focused test and
  the relevant workspace checks after the implementation.
- Validate data at every external boundary with shared schemas from
  `packages/validators`.
- Require server-side ownership checks for privileged operations. Client
  claims, user metadata, and any value from an external integration are
  untrusted.
- For Supabase tables exposed through the Data API, enable RLS and use an
  owner predicate for every user-specific operation. Never bundle a service
  role key in the mobile app.
- Preserve posted ledger entries: correct them with linked reversals instead
  of destructive edits or deletes.
- Give offline writes a client-generated UUID, idempotency key, revision, and
  explicit conflict state. Never silently overwrite a conflict.
- Keep realized cash flow separate from estimates, valuations, and
  hypothetical sale outcomes in both data and UI copy.

## Repository boundaries

- `apps/mobile`: Expo Router UI, local projection/outbox, and secure session
  storage. Public Supabase configuration only.
- `apps/api`: server-authoritative routes for signed receipt uploads,
  RevenueCat webhooks, exports, and other privileged work.
- `packages/financial-engine`: pure, exact calculations with no UI or network
  dependencies.
- `packages/validators`: shared Zod contracts for external inputs.
- `supabase/migrations`: durable schema, constraints, indexes, grants, and
  RLS policies.

## Integration limits

Do not invent Supabase, RevenueCat, OAuth, app-store, or ForgeKeep API
credentials/endpoints. Add tested boundaries and document the required
configuration instead. Keep premium pricing and limits configurable, never in
financial-calculation code.
