import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { createClient, type Session } from '@supabase/supabase-js';
import { Pressable, Text, TextInput } from 'react-native';
import { AuthProvider, AuthGate, useAuth } from '../src/auth';
import { secureSessionStorage, SESSION_STORAGE_KEY } from '../src/supabase';

const session: Session = {
  access_token: 'test-access-token', refresh_token: 'test-refresh-token',
  token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600,
  user: { id: 'user-1', aud: 'authenticated', app_metadata: {}, user_metadata: {},
    created_at: '2026-10-20T00:00:00Z', email: 'player@example.com' },
};
let tree: ReactTestRenderer | undefined;
afterEach(async () => {
  if (tree) await act(async () => tree!.unmount());
  tree = undefined;
  await secureSessionStorage.removeItem(SESSION_STORAGE_KEY);
});
function makeClient(fetcher: typeof fetch = vi.fn(async () => new Response(null, { status: 204 }))) {
  return createClient('https://auth-test.example.com', 'test-publishable-key', {
    auth: { storage: secureSessionStorage, storageKey: SESSION_STORAGE_KEY,
      autoRefreshToken: false, detectSessionInUrl: false, persistSession: true },
    global: { fetch: fetcher },
  });
}
function ProtectedScreen() {
  const auth = useAuth();
  return <Text onPress={() => auth.signOut()}>{auth.session?.user.email}</Text>;
}
describe('mobile authentication boundary', () => {
  it('restores the secure session before exposing protected screens', async () => {
    await secureSessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    await act(async () => {
      tree = create(<AuthProvider client={makeClient()}><AuthGate><ProtectedScreen /></AuthGate></AuthProvider>);
    });
    expect(JSON.stringify(tree!.toJSON())).toContain('player@example.com');
    expect(JSON.stringify(tree!.toJSON())).not.toContain('Sign in to ForgeKeep');
  });
  it('sign-out erases secure tokens and removes the protected screen', async () => {
    await secureSessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    await act(async () => {
      tree = create(<AuthProvider client={makeClient()}><AuthGate><ProtectedScreen /></AuthGate></AuthProvider>);
    });
    await act(async () => tree!.root.findByType(Text).props.onPress());
    expect(await secureSessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    expect(JSON.stringify(tree!.toJSON())).not.toContain('player@example.com');
    expect(JSON.stringify(tree!.toJSON())).toContain('Sign in to ForgeKeep');
  });
  it('does not mount private content for an unauthenticated deep link', async () => {
    let privateMounts = 0;
    function PrivateRoute() { privateMounts++; return <Text>Private ledger</Text>; }
    await act(async () => {
      tree = create(<AuthProvider client={makeClient()}><AuthGate><PrivateRoute /></AuthGate></AuthProvider>);
    });
    expect(privateMounts).toBe(0);
    expect(JSON.stringify(tree!.toJSON())).toContain('Sign in to ForgeKeep');
    expect(JSON.stringify(tree!.toJSON())).not.toContain('Continue with Google');
  });
  it('submits email/password to Supabase and enters the authenticated app', async () => {
    const client = makeClient(async (url, init) => {
      expect(String(url)).toBe('https://auth-test.example.com/auth/v1/token?grant_type=password');
      expect(JSON.parse(String(init?.body))).toMatchObject({ email: 'player@example.com', password: 'test-password' });
      return new Response(JSON.stringify(session), { headers: { 'Content-Type': 'application/json' } });
    });
    await act(async () => { tree = create(<AuthProvider client={client}><AuthGate><ProtectedScreen /></AuthGate></AuthProvider>); });
    await act(async () => {
      const inputs = tree!.root.findAllByType(TextInput);
      inputs[0]!.props.onChangeText(' player@example.com ');
      inputs[1]!.props.onChangeText('test-password');
    });
    await act(async () => { tree!.root.findByType(Pressable).props.onPress(); });
    expect(JSON.stringify(tree!.toJSON())).toContain('player@example.com');
    expect(JSON.parse((await secureSessionStorage.getItem(SESSION_STORAGE_KEY))!)).toMatchObject({ access_token: 'test-access-token' });
  });
  it('keeps protected screens unmounted after rejected credentials and announces an error', async () => {
    const client = makeClient(async () => new Response(JSON.stringify({ error: 'invalid_grant', error_description: 'Invalid login credentials' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    }));
    await act(async () => { tree = create(<AuthProvider client={client}><AuthGate><ProtectedScreen /></AuthGate></AuthProvider>); });
    await act(async () => {
      const inputs = tree!.root.findAllByType(TextInput);
      inputs[0]!.props.onChangeText('player@example.com'); inputs[1]!.props.onChangeText('wrong-password');
    });
    await act(async () => { tree!.root.findByType(Pressable).props.onPress(); });
    expect(tree!.root.findByProps({ accessibilityRole: 'alert' }).children.join('')).toContain('Sign-in failed');
    expect(JSON.stringify(tree!.toJSON())).toContain('Sign in to ForgeKeep');
    expect(await secureSessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });
});
