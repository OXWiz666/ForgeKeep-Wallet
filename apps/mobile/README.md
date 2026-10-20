# ForgeKeep mobile

From the repository root, run `pnpm install --frozen-lockfile`, then
`pnpm --filter @forgekeep/mobile start`. Open the app with Expo Go or an Android
development build compatible with Expo SDK 54. The mobile app targets Android/iOS;
SecureStore persistence requires a native device and has no browser-storage fallback.

Copy this directory's `.env.example` to `.env` and provide the existing Supabase
project URL and **publishable** key. Expo exposes `EXPO_PUBLIC_*` values in the app:
never enter a service-role/secret key, Google client secret, or database password.
Restart Expo after changing environment values. Missing Supabase configuration
shows a setup message and prevents private screens from mounting.

Email/password sign-in uses an existing Supabase Auth account. Create or invite
accounts through the configured Supabase project; account registration and password
recovery are separate future flows. The UI boundary protects local navigation;
server APIs and RLS must still authorize every data operation.

Sessions and the OAuth PKCE verifier are stored only in Expo SecureStore. Large
sessions are divided into SecureStore items below the native 2 KiB item limit,
without splitting Unicode characters. Partial records fail closed. Signing out
removes all session fragments, unmounts private screens, and clears that user's
in-memory query cache. Sign-out uses Supabase's `local` scope (this device); a
provider/network failure is shown and can be retried. Other devices stay signed in.

Google sign-in is hidden by default. To enable it:

1. Configure the Google OAuth provider and credentials in Supabase Auth. Configure
   Google's authorized Supabase callback URL using the URL shown in that dashboard.
2. Allow `forgekeep://auth/callback` in the project's Supabase Auth redirect URLs.
3. Set `EXPO_PUBLIC_GOOGLE_AUTH_ENABLED=true` and
   `EXPO_PUBLIC_GOOGLE_REDIRECT_URI=forgekeep://auth/callback` in the mobile `.env`.
4. Test with a native development build registering the `forgekeep` scheme from
   `app.json`. Expo Go does not register this app's custom callback scheme.

Google uses a browser auth session and PKCE code exchange. No Google credentials
are bundled in the app. Canceled browser sessions leave the user signed out.

Verification commands from the repository root:

```sh
pnpm --filter @forgekeep/mobile test
pnpm --filter @forgekeep/mobile typecheck
pnpm --filter @forgekeep/mobile exec expo export --platform android --dev --output-dir dist/task-6-smoke --max-workers 2
```

The component tests run real React and Supabase Auth against a controlled HTTP
boundary and a native-storage bridge double enforcing SecureStore's item limit.
They do not prove device keychain behavior or a live provider sign-in. The last
command compiles an Android development bundle; it does not produce or install an APK.
