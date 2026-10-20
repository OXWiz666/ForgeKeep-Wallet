import { vi } from 'vitest';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
// The native OS bridge is unavailable in Node; keep React and Supabase real.
vi.mock('expo-secure-store', () => {
  const values = new Map<string, string>();
  return {
    getItemAsync: async (key: string) => values.get(key) ?? null,
    setItemAsync: async (key: string, value: string) => {
      if (new TextEncoder().encode(value).length > 2048) throw new Error('SecureStore item exceeds native size limit');
      if (!value.isWellFormed()) throw new Error('Native storage cannot safely encode an unpaired surrogate');
      values.set(key, value);
    },
    deleteItemAsync: async (key: string) => { values.delete(key); },
  };
});
vi.mock('expo-web-browser', () => ({
  openAuthSessionAsync: vi.fn(), maybeCompleteAuthSession() {},
  WebBrowserResultType: { CANCEL: 'cancel', DISMISS: 'dismiss', OPENED: 'opened', LOCKED: 'locked' },
}));
vi.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  digest: vi.fn(async () => new Uint8Array(32).buffer),
}));
vi.mock('expo-standard-web-crypto', () => {
  const standardCrypto = {
    getRandomValues: <T extends ArrayBufferView>(values: T) => {
      new Uint8Array(values.buffer, values.byteOffset, values.byteLength).fill(7);
      return values;
    },
  };
  return {
    default: standardCrypto,
    polyfillWebCrypto: vi.fn(() => Object.defineProperty(globalThis, 'crypto', {
      configurable: true, value: standardCrypto,
    })),
  };
});
