import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: { alias: { 'react-native': fileURLToPath(new URL('./test/native.ts', import.meta.url).href) } },
  esbuild: { jsx: 'automatic' },
  test: { include: ['test/**/*.test.ts?(x)'], setupFiles: ['test/setup.ts'] },
});
