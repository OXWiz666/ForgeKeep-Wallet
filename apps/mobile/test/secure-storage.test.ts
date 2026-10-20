import { expect, it } from 'vitest';
import { secureSessionStorage } from '../src/supabase';
import * as SecureStore from 'expo-secure-store';

it('round-trips a large Unicode session within native SecureStore item limits and deletes every fragment', async () => {
  const value = JSON.stringify({ access_token: 'token', metadata: '💰'.repeat(1800) });
  await secureSessionStorage.setItem('large-session', value);
  expect(await secureSessionStorage.getItem('large-session')).toBe(value);
  await secureSessionStorage.removeItem('large-session');
  expect(await secureSessionStorage.getItem('large-session')).toBeNull();
  for (let i = 0; i < 20; i++) expect(await SecureStore.getItemAsync(`large-session.${i}`)).toBeNull();
});

it('does not split a Unicode character between native storage items', async () => {
  const value = 'x' + '💰'.repeat(1000);
  await secureSessionStorage.setItem('unicode-session', value);
  expect(await secureSessionStorage.getItem('unicode-session')).toBe(value);
  await secureSessionStorage.removeItem('unicode-session');
});
