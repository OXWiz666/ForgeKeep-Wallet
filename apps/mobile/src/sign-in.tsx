import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useAuth } from './auth';
import { googleAuthEnabled } from './supabase';
import { colors, styles } from './theme';

export function SignInScreen() {
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async (google = false) => {
    if (busy) return;
    if (!google && (!email.trim() || !password)) { setError('Enter your email and password.'); return; }
    setBusy(true); setError(null);
    try {
      if (google) await auth.signInWithGoogle();
      else await auth.signIn(email, password);
    } catch {
      // Avoid displaying raw provider responses that can contain sensitive details.
      setError(google ? 'Google sign-in could not complete. Please try again.' : 'Sign-in failed. Check your email and password or try again when connected.');
    } finally { setBusy(false); }
  };
  return <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.kicker}>FORGEKEEP / WALLET</Text>
      <Text accessibilityRole="header" style={styles.title}>Sign in to ForgeKeep</Text>
      <Text style={styles.copy}>Your private ledger for every realm, account, and character.</Text>
      <View style={{ gap: 10 }}>
        <Text style={styles.label}>Email</Text>
        <TextInput accessibilityLabel="Email" style={styles.input} value={email} onChangeText={setEmail}
          autoComplete="email" textContentType="username" keyboardType="email-address" autoCapitalize="none"
          autoCorrect={false} editable={!busy} placeholder="you@example.com" placeholderTextColor={colors.muted} />
        <Text style={styles.label}>Password</Text>
        <TextInput accessibilityLabel="Password" style={styles.input} value={password} onChangeText={setPassword}
          secureTextEntry autoComplete="current-password" textContentType="password" autoCapitalize="none"
          autoCorrect={false} editable={!busy} onSubmitEditing={() => void submit()} />
      </View>
      {(error || auth.error) && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{error || auth.error}</Text>}
      <Pressable accessibilityRole="button" accessibilityLabel="Sign in" accessibilityState={{ disabled: busy, busy }}
        disabled={busy} style={[styles.button, busy && styles.disabled]} onPress={() => void submit()}>
        <Text style={styles.buttonText}>{busy ? 'Signing in…' : 'Sign in'}</Text>
      </Pressable>
      {googleAuthEnabled && <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy }} disabled={busy}
        style={styles.secondary} onPress={() => void submit(true)}><Text style={styles.secondaryText}>Continue with Google</Text></Pressable>}
    </ScrollView>
  </KeyboardAvoidingView>;
}
