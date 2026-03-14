import path from 'path';
import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      $lib: path.resolve(__dirname, 'client/src/lib'),
    },
    conditions: ['browser'],
  },
  test: {
    include: ['server/tests/**/*.test.ts', 'client/tests/**/*.test.ts'],
    environment: 'node',
    setupFiles: ['./client/tests/setup.ts'],
  },
});
