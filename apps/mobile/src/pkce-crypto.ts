import { CryptoDigestAlgorithm, digest } from 'expo-crypto';
import standardCrypto, { polyfillWebCrypto } from 'expo-standard-web-crypto';

type PkceCrypto = {
  getRandomValues<T extends ArrayBufferView>(values: T): T;
  subtle?: {
    digest(algorithm: string | { name: string }, data: BufferSource): Promise<ArrayBuffer>;
  };
};

function sha256Digest(algorithm: string | { name: string }, data: BufferSource) {
  const name = typeof algorithm === 'string' ? algorithm : algorithm.name;
  if (name.toUpperCase() !== 'SHA-256') throw new Error(`Unsupported PKCE digest algorithm: ${name}`);
  return digest(CryptoDigestAlgorithm.SHA256, data);
}

/**
 * Supabase Auth requires Web Crypto to create S256 PKCE challenges. Expo
 * provides secure random values but not the full `subtle` surface, so expose
 * the one native-backed operation Auth uses before creating the client.
 */
export function installSupabasePkceCrypto() {
  polyfillWebCrypto();
  const scope = globalThis as typeof globalThis & { crypto?: PkceCrypto };
  if (!scope.crypto) {
    Object.defineProperty(scope, 'crypto', { configurable: true, value: standardCrypto });
  }
  if (!scope.crypto?.getRandomValues) throw new Error('Secure random values are unavailable for PKCE.');
  if (!scope.crypto.subtle) {
    Object.defineProperty(scope.crypto, 'subtle', {
      configurable: true,
      value: { digest: sha256Digest },
    });
  }
}
