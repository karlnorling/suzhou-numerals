import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const source = (pkg: string) =>
  fileURLToPath(new URL(`./packages/@suzhou-numerals/${pkg}/src/index.ts`, import.meta.url));

export default defineConfig({
  resolve: {
    // Test against source, matching the paths in tsconfig.json.
    alias: {
      '@suzhou-numerals/core': source('core'),
      '@suzhou-numerals/raster': source('raster'),
    },
  },
  test: {
    include: ['packages/*/*/test/**/*.test.ts'],
  },
});
