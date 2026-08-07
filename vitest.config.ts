import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

/**
 * Centralized Vitest configuration for the TraceMemo monorepo.
 *
 * Tests live next to the code they cover (packages, pages, chrome-extension).
 * Workspace packages are aliased to their source so tests run without a prior
 * build. The default environment is Node; DOM/adapter tests opt in per-file
 * with: // @vitest-environment jsdom
 */
export default defineConfig({
  resolve: {
    alias: {
      '@extension/shared': resolve(__dirname, 'packages/shared/index.mts'),
      '@extension/research-db': resolve(__dirname, 'packages/research-db/index.mts'),
      '@extension/storage': resolve(__dirname, 'packages/storage/index.mts'),
      '@extension/i18n': resolve(__dirname, 'packages/i18n/index.mts'),
    },
  },
  test: {
    environment: 'node',
    include: [
      'chrome-extension/**/*.test.ts',
      'packages/**/*.test.ts',
      'packages/**/*.test.tsx',
      'pages/**/*.test.ts',
      'pages/**/*.test.tsx',
    ],
    exclude: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.turbo/**'],
    globals: false,
    clearMocks: true,
  },
});
