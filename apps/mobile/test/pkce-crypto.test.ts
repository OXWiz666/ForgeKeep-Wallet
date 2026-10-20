import { afterEach, expect, it, vi } from 'vitest';
import { CryptoDigestAlgorithm, digest } from 'expo-crypto';
import standardCrypto, { polyfillWebCrypto } from 'expo-standard-web-crypto';
import { installSupabasePkceCrypto } from '../src/pkce-crypto';

const originalCrypto = Object.getOwnPropertyDescriptor(globalThis, 'crypto');

afterEach(() => {
  vi.restoreAllMocks();
  if (originalCrypto) Object.defineProperty(globalThis, 'crypto', originalCrypto);
  else Reflect.deleteProperty(globalThis, 'crypto');
});

it('installs secure random values and SHA-256 before Supabase starts PKCE', async () => {
  const randomValues = vi.spyOn(standardCrypto, 'getRandomValues');
  Reflect.deleteProperty(globalThis, 'crypto');

  installSupabasePkceCrypto();

  expect(polyfillWebCrypto).toBeTypeOf('function');
  expect(globalThis.crypto).toBeDefined();
  expect(globalThis.crypto.getRandomValues(new Uint8Array(4))).toHaveLength(4);
  await expect(globalThis.crypto.subtle.digest('SHA-256', new Uint8Array([1, 2, 3]))).resolves.toBeInstanceOf(ArrayBuffer);
  expect(randomValues).toHaveBeenCalled();
  expect(digest).toHaveBeenCalledWith(CryptoDigestAlgorithm.SHA256, expect.any(Uint8Array));
});
