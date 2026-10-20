# Privileged API

Run `pnpm --filter @forgekeep/api dev` from the workspace root. Production builds use
`pnpm --filter @forgekeep/api build`, then `pnpm --filter @forgekeep/api start`.
API environment variables belong in `apps/api/.env.local` or the hosting platform's
server environment. Never prefix secrets with `NEXT_PUBLIC_` or `EXPO_PUBLIC_`.

Required for receipt signing: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
Required for the RevenueCat inbox: `DATABASE_URL` (trusted PostgreSQL connection),
`REVENUECAT_WEBHOOK_AUTHORIZATION` (the exact authorization header configured in
RevenueCat). No external integration is enabled or credential supplied by this code.
Missing configuration returns a generic 503; the health check requires no credentials.

Apply the Supabase SQL migrations before enabling the integrations. They own the
schema, receipt bucket restrictions, and read policy. Prisma maps only the webhook
inbox; use `pnpm --filter @forgekeep/api prisma:generate`, never `prisma migrate` or
`prisma db push` for this SQL-owned database.

`POST /api/receipts/sign-upload` requires `Authorization: Bearer <Supabase access
token>` and a JSON body:

```json
{
  "transactionId": "22222222-2222-4222-8222-222222222222",
  "storagePath": "11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222/receipt.png",
  "contentType": "image/png",
  "byteSize": 1024
}
```

The storage path is `<verified-user-id>/<owned-transaction-id>/<filename>`, where
the filename contains letters, digits, underscores or hyphens and a matching
`.png`, `.jpg`, `.jpeg`, or `.pdf` extension. The response contains `bucket`,
`storagePath`, `signedUrl`, and `token`. Upload with Supabase's signed-upload API.
URLs expire after two hours, and replacements are disabled. The private bucket
also enforces JPEG/PNG/PDF and 10 MiB, because signed tokens do not bind the
declared content type or byte size. Actual file content scanning and attachment
finalization are outside this signing boundary; declared metadata is not persisted
as an uploaded attachment here.

`POST /api/webhooks/revenuecat` authenticates the configured authorization header,
validates the event envelope, and atomically inserts it once into
`subscription_events`. Duplicate IDs return HTTP 200 without replacing the first
payload; persistence failures return HTTP 503 so the provider can retry. This is a
durable inbox skeleton: it does not grant entitlements or run business effects.

Run `pnpm --filter @forgekeep/api test`. Route tests fake only external HTTP and
Prisma I/O; the SQL test applies the real migration to embedded PostgreSQL and
checks duplicate inserts, access grants, owner reads, and bucket limits. Full
Supabase Auth/Storage integration still requires a configured Supabase stack.
