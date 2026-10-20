import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';
import { installSupabasePkceCrypto } from './pkce-crypto';

installSupabasePkceCrypto();

export const SESSION_STORAGE_KEY = 'forgekeep.auth.session';
const chunkCount = (value: string | null) => value?.startsWith('chunks:') ? Number(value.slice(7)) : 0;
export const secureSessionStorage = {
  async getItem(key: string) {
    const value = await SecureStore.getItemAsync(key);
    const count = chunkCount(value);
    if (!count) return value;
    const chunks = await Promise.all(Array.from({ length: count }, (_, i) => SecureStore.getItemAsync(`${key}.${i}`)));
    if (chunks.some(chunk => chunk === null)) {
      await secureSessionStorage.removeItem(key);
      return null;
    }
    return chunks.join('');
  },
  async setItem(key: string, value: string) {
    await secureSessionStorage.removeItem(key);
    // 500 Unicode code points fit below 2 KiB without splitting surrogate pairs.
    if (value.length <= 500) { await SecureStore.setItemAsync(key, value); return; }
    const characters = Array.from(value);
    const chunks = Array.from({ length: Math.ceil(characters.length / 500) }, (_, i) => characters.slice(i * 500, (i + 1) * 500).join(''));
    await SecureStore.setItemAsync(key, `chunks:${chunks.length}`);
    try {
      for (let i = 0; i < chunks.length; i++) await SecureStore.setItemAsync(`${key}.${i}`, chunks[i]!);
    } catch (error) {
      await secureSessionStorage.removeItem(key);
      throw error;
    }
  },
  async removeItem(key: string) {
    const count = chunkCount(await SecureStore.getItemAsync(key));
    await Promise.all(Array.from({ length: count }, (_, i) => SecureStore.deleteItemAsync(`${key}.${i}`)));
    await SecureStore.deleteItemAsync(key);
  },
};

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
// Missing configuration must never silently connect to an invented project.
export const supabase = url && key ? createClient(url, key, {
  auth: {
    storage: secureSessionStorage,
    storageKey: SESSION_STORAGE_KEY,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
}) : null;

export const googleRedirectUri = process.env.EXPO_PUBLIC_GOOGLE_REDIRECT_URI;
export const googleAuthEnabled = process.env.EXPO_PUBLIC_GOOGLE_AUTH_ENABLED === 'true'
  && googleRedirectUri === 'forgekeep://auth/callback';
