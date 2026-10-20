# ForgeKeep Wallet release runbook

1. Confirm `origin/dev` is green: lint, unit tests, type checks, production build,
   and local Supabase migration lint.
2. Review `supabase/migrations` and run `supabase db advisors` against the target
   project. Resolve security or performance findings before applying migrations.
3. Apply migrations with `supabase db push --linked`; record the migration history.
4. Set API secrets in the hosting provider, then deploy `apps/api` with its Prisma
   client generated from the SQL-owned schema.
5. Configure EAS Android credentials and build profiles. Never include service-role
   or database credentials in EAS environment variables.
6. Configure Sentry release and source-map upload from CI. Keep Sentry auth tokens
   in CI secrets and verify access-token/receipt redaction in logs.
7. Configure RevenueCat webhook authorization and verify duplicate delivery returns
   HTTP 200 without replacing the original event.
8. Smoke-test authentication, RLS ownership, ledger insertion, reversal creation,
   offline retry, conflict visibility, and essential export after entitlement expiry.
9. Roll back application code first if needed. Treat SQL migrations as additive;
   use a reviewed forward correction rather than destructive rollback.
