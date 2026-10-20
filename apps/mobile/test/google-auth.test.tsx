import { afterEach, expect, it, vi } from 'vitest';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { createClient } from '@supabase/supabase-js';
import { Pressable } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { AuthGate, AuthProvider } from '../src/auth';
import { secureSessionStorage, SESSION_STORAGE_KEY } from '../src/supabase';

vi.mock('../src/supabase', async importOriginal => ({
  ...await importOriginal<typeof import('../src/supabase')>(),
  googleAuthEnabled: true,
  googleRedirectUri: 'forgekeep://auth/callback',
}));
let tree: ReactTestRenderer | undefined;
afterEach(async () => {
  if (tree) await act(async () => tree!.unmount());
  tree = undefined;
  await secureSessionStorage.removeItem(SESSION_STORAGE_KEY);
  await secureSessionStorage.removeItem(`${SESSION_STORAGE_KEY}-code-verifier`);
  vi.resetAllMocks();
});
function client(fetcher?: typeof fetch) {
  return createClient('https://auth-test.example.com', 'test-publishable-key', {
    auth: { storage: secureSessionStorage, storageKey: SESSION_STORAGE_KEY,
      flowType: 'pkce', autoRefreshToken: false, persistSession: true, detectSessionInUrl: false },
    ...(fetcher ? { global: { fetch: fetcher } } : {}),
  });
}
it('opens the configured Google PKCE flow and stays signed out when the browser is canceled', async () => {
  let browserOpened = false;
  vi.mocked(WebBrowser.openAuthSessionAsync).mockImplementation(async (url, redirect) => {
    const authorization = new URL(String(url));
    expect(authorization.origin + authorization.pathname).toBe('https://auth-test.example.com/auth/v1/authorize');
    expect(authorization.searchParams.get('provider')).toBe('google');
    expect(authorization.searchParams.get('redirect_to')).toBe('forgekeep://auth/callback');
    expect(authorization.searchParams.get('code_challenge')).toBeTruthy();
    expect(authorization.searchParams.get('code_challenge_method')).toBe('s256');
    expect(authorization.searchParams.get('code_challenge')).not.toBe(
      await secureSessionStorage.getItem(`${SESSION_STORAGE_KEY}-code-verifier`),
    );
    expect(redirect).toBe('forgekeep://auth/callback');
    browserOpened = true;
    return { type: WebBrowser.WebBrowserResultType.CANCEL };
  });
  await act(async () => { tree = create(<AuthProvider client={client()}><AuthGate>Private ledger</AuthGate></AuthProvider>); });
  await act(async () => {
    tree!.root.findAllByType(Pressable)[1]!.props.onPress();
    await vi.waitFor(() => expect(WebBrowser.openAuthSessionAsync).toHaveBeenCalled());
  });
  expect(browserOpened).toBe(true);
  expect(JSON.stringify(tree!.toJSON())).toContain('Sign in to ForgeKeep');
  expect(JSON.stringify(tree!.toJSON())).not.toContain('Private ledger');
});
it('rejects a callback with a different app destination before exchanging a code', async () => {
  vi.mocked(WebBrowser.openAuthSessionAsync).mockResolvedValue({ type: 'success', url: 'other-app://auth/callback?code=test-code' });
  await act(async () => { tree = create(<AuthProvider client={client()}><AuthGate>Private ledger</AuthGate></AuthProvider>); });
  await act(async () => {
    tree!.root.findAllByType(Pressable)[1]!.props.onPress();
    await vi.waitFor(() => expect(WebBrowser.openAuthSessionAsync).toHaveBeenCalled());
  });
  expect(tree!.root.findByProps({ accessibilityRole: 'alert' }).children.join('')).toContain('Google sign-in could not complete');
  expect(await secureSessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
});

it('exchanges the returned Google code with the secure PKCE verifier before entering the app', async () => {
  vi.mocked(WebBrowser.openAuthSessionAsync).mockResolvedValue({ type: 'success', url: 'forgekeep://auth/callback?code=test-google-code' });
  let exchanged = false;
  const authClient = client(async (url, init) => {
    expect(String(url)).toBe('https://auth-test.example.com/auth/v1/token?grant_type=pkce');
    const body = JSON.parse(String(init?.body));
    expect(body.auth_code).toBe('test-google-code');
    expect(body.code_verifier.length).toBeGreaterThanOrEqual(43);
    exchanged = true;
    return new Response(JSON.stringify({
      access_token: 'google-access-token', refresh_token: 'google-refresh-token',
      token_type: 'bearer', expires_in: 3600,
      user: { id: 'google-user', aud: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: '2026-10-20T00:00:00Z' },
    }), { headers: { 'Content-Type': 'application/json' } });
  });
  await act(async () => { tree = create(<AuthProvider client={authClient}><AuthGate>Private ledger</AuthGate></AuthProvider>); });
  await act(async () => {
    tree!.root.findAllByType(Pressable)[1]!.props.onPress();
    await vi.waitFor(() => expect(exchanged).toBe(true));
  });
  expect(JSON.stringify(tree!.toJSON())).toContain('Private ledger');
  expect(JSON.parse((await secureSessionStorage.getItem(SESSION_STORAGE_KEY))!)).toMatchObject({ access_token: 'google-access-token' });
});
