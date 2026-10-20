# ForgeKeep Wallet setup

## Prerequisites

- Node.js 22 or newer
- pnpm 10.23.0 (`pnpm --version` should print `10.23.0`)
- Supabase CLI 2.x
- Docker Desktop for local Supabase and migration linting
- Android Studio or Expo Go for mobile development

Corepack shims are optional on Windows. If `corepack enable` fails with EPERM,
use the user-level pnpm already installed and run `pnpm` directly.

## Install

```powershell
git clone https://github.com/OXWiz666/ForgeKeep-Wallet.git
cd ForgeKeep-Wallet
git switch dev
git pull origin dev
pnpm install --frozen-lockfile
```

### Windows Corepack / EPERM workaround

If `corepack enable` reports `EPERM` while writing under `C:\\Program Files\\nodejs`,
use a user-level pnpm installation instead:

```powershell
npm install --global pnpm@10.23.0
$env:Path = "$env:APPDATA\\npm;$env:Path"
pnpm --version
pnpm install --frozen-lockfile
```

Alternatively, run a command without a global install:

```powershell
npx --yes pnpm@10.23.0 install --frozen-lockfile
```

The expected version is `10.23.0`. Close and reopen PowerShell after changing
PATH so the new command shim is picked up.

## Environment

Copy the variables from `docs/environment.example` into the appropriate files.
The committed `.env.example` files are safe templates; replace every placeholder
with a value from the relevant provider and never commit the resulting files:

```powershell
Copy-Item docs/environment.example .env
Copy-Item docs/environment.example apps/api/.env.local
Copy-Item apps/mobile/.env.example apps/mobile/.env
```

Mobile variables:

- `EXPO_PUBLIC_SUPABASE_URL`: Supabase project URL (`https://<ref>.supabase.co`).
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Supabase publishable/anon key from project API settings.
- `EXPO_PUBLIC_GOOGLE_AUTH_ENABLED`: `false` until the Supabase Google provider and redirect URI are configured.
- `EXPO_PUBLIC_GOOGLE_REDIRECT_URI`: `forgekeep://auth/callback` for the Expo app scheme.

Server/tooling variables:

- `SUPABASE_ACCESS_TOKEN`: personal access token used by the Supabase CLI only.
- `SUPABASE_DB_PASSWORD`: database password used by Supabase CLI linking/local commands.
- `SUPABASE_URL`: same project URL for trusted API code.
- `SUPABASE_SERVICE_ROLE_KEY`: service-role secret for trusted API code only.
- `DATABASE_URL`: Prisma/Postgres connection string for the privileged API.
- `REVENUECAT_WEBHOOK_AUTHORIZATION`: exact `Authorization` header value configured in RevenueCat.

The service-role key, database URL, RevenueCat authorization, and Supabase access
token must never be placed in `apps/mobile/.env` or any `NEXT_PUBLIC_*` variable.

## Supabase

```powershell
supabase login
supabase link --project-ref olqusuzpxkcqnapxxmnn
supabase start
supabase db push --local
pnpm db:verify
```

If Docker Desktop is not running, `supabase start`, `supabase db push --local`,
and `pnpm db:verify` will fail; start Docker and repeat those commands. The CLI
prints local credentials in its output. Use those values for local database
tooling only; use the linked project's API settings for hosted values.

For the remote project, use `supabase db push --linked` only after reviewing the
migration plan and taking the required database backup. Run `supabase db advisors`
against the configured project before production release.

## Run

Use separate terminals:

```powershell
pnpm --filter @forgekeep/api dev
pnpm --filter @forgekeep/mobile start
```

Open the Expo QR code on an Android device/emulator. Configure Google OAuth only
after adding the Supabase provider credentials and redirect URL; leave the feature
flag false otherwise.

## Verify

```powershell
pnpm lint
pnpm test
pnpm typecheck
pnpm build
pnpm verify:project
```

`pnpm db:verify` is intentionally run only with a local Supabase stack (or a
deliberately configured linked database). It is not a substitute for applying
reviewed migrations to production.

## Production boundaries

- EAS builds receive only mobile `EXPO_PUBLIC_*` values.
- The API host receives server secrets through its deployment secret manager.
- Sentry DSN is non-secret and may be configured in the mobile release environment;
  Sentry auth tokens remain CI secrets.
- RevenueCat webhooks are accepted only with the exact server authorization header.
- ForgeKeep account linking remains disabled until a verified provider API exists.
