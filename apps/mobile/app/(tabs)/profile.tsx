import { useState } from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import { useAuth } from '../../src/auth';
import { styles } from '../../src/theme';

export default function Profile() {
  const { session, signOut } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async () => {
    if (busy) return;
    setBusy(true); setError(null);
    try { await signOut(); }
    catch { setError('Sign-out could not complete. Please reconnect and try again.'); setBusy(false); }
  };
  return <ScrollView style={styles.page} contentContainerStyle={styles.content}>
    <Text style={styles.kicker}>FORGEKEEP / WALLET</Text>
    <Text accessibilityRole="header" style={styles.title}>Profile</Text>
    <Text style={styles.copy}>{session?.user.email}</Text>
    {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy, busy }} disabled={busy}
      onPress={() => void submit()} style={[styles.button, busy && styles.disabled]}>
      <Text style={styles.buttonText}>{busy ? 'Signing out…' : 'Sign out'}</Text>
    </Pressable>
  </ScrollView>;
}
