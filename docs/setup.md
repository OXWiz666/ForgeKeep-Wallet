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

## Environment

Copy the variables from `docs/environment.example` into the appropriate files:

```powershell
Copy-Item docs/environment.example .env
Copy-Item docs/environment.example apps/api/.env.local
```

For the mobile app, only use the four `EXPO_PUBLIC_*` variables. The service-role
key, database URL, RevenueCat authorization, and Supabase access token must never
be placed in `apps/mobile/.env` or any `NEXT_PUBLIC_*` variable.

## Supabase

```powershell
supabase login
supabase link --project-ref olqusuzpxkcqnapxxmnn
supabase start
supabase db push --local
pnpm db:verify
```

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

## Production boundaries

- EAS builds receive only mobile `EXPO_PUBLIC_*` values.
- The API host receives server secrets through its deployment secret manager.
- Sentry DSN is non-secret and may be configured in the mobile release environment;
  Sentry auth tokens remain CI secrets.
- RevenueCat webhooks are accepted only with the exact server authorization header.
- ForgeKeep account linking remains disabled until a verified provider API exists.
