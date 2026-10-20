import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { ActivityIndicator, AppState, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { googleAuthEnabled, googleRedirectUri, supabase } from './supabase';
import { SignInScreen } from './sign-in';
import { colors, styles } from './theme';

type AuthState = {
  session: Session | null;
  loading: boolean;
  configured: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
};
const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children, client = supabase }: PropsWithChildren<{ client?: SupabaseClient | null }>) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!client) { setLoading(false); return; }
    let active = true;
    let authVersion = 0;
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, nextSession) => {
      authVersion++;
      if (active) { setSession(nextSession); setLoading(false); }
    });
    const version = authVersion;
    client.auth.getSession().then(({ data, error: restoreError }) => {
      if (active && version === authVersion) {
        setSession(restoreError ? null : data.session);
        setError(restoreError ? 'Unable to restore your session. Please sign in again.' : null);
        setLoading(false);
      }
    }).catch(() => {
      if (active) { setSession(null); setError('Unable to read secure storage. Please restart the app.'); setLoading(false); }
    });
    const updateRefresh = (state: string) => {
      if (state === 'active') client.auth.startAutoRefresh();
      else client.auth.stopAutoRefresh();
    };
    updateRefresh(AppState.currentState);
    const listener = AppState.addEventListener('change', updateRefresh);
    return () => { active = false; subscription.unsubscribe(); listener.remove(); client.auth.stopAutoRefresh(); };
  }, [client]);

  const value: AuthState = {
    session, loading, error, configured: Boolean(client),
    async signIn(email, password) {
      if (!client) throw new Error('Authentication is not configured.');
      const { error: signInError } = await client.auth.signInWithPassword({ email: email.trim(), password });
      if (signInError) throw signInError;
      setError(null);
    },
    async signOut() {
      if (!client) return;
      const { error: signOutError } = await client.auth.signOut({ scope: 'local' });
      if (signOutError) throw signOutError;
      setSession(null);
    },
    async signInWithGoogle() {
      if (!client || !googleAuthEnabled || !googleRedirectUri) throw new Error('Google sign-in is not configured.');
      const { data, error: oauthError } = await client.auth.signInWithOAuth({
        provider: 'google', options: { redirectTo: googleRedirectUri, skipBrowserRedirect: true },
      });
      if (oauthError) throw oauthError;
      const result = await WebBrowser.openAuthSessionAsync(data.url, googleRedirectUri);
      if (result.type !== 'success') return;
      const callback = new URL(result.url);
      const expected = new URL(googleRedirectUri);
      if (callback.protocol !== expected.protocol || callback.host !== expected.host || callback.pathname !== expected.pathname) {
        throw new Error('Unexpected sign-in callback.');
      }
      const code = callback.searchParams.get('code');
      if (!code || callback.searchParams.has('error')) throw new Error('Google sign-in did not complete. Please try again.');
      const { error: exchangeError } = await client.auth.exchangeCodeForSession(code);
      if (exchangeError) throw exchangeError;
    },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('AuthProvider is required.');
  return auth;
}
export function AuthGate({ children }: PropsWithChildren) {
  const { loading, configured, session } = useAuth();
  if (loading) return <View style={[styles.page, { justifyContent: 'center' }]}><ActivityIndicator color={colors.accent} accessibilityLabel="Restoring your secure session" /></View>;
  if (!configured) return <View style={[styles.page, styles.content]}><Text accessibilityRole="header" style={styles.title}>Connect ForgeKeep</Text><Text style={styles.copy}>Set the mobile Supabase URL and publishable key to enable sign-in.</Text></View>;
  if (!session) return <SignInScreen />;
  return children;
}
