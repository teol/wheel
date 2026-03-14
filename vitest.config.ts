import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    conditions: ['browser'],
  },
  test: {
    include: ['server/tests/**/*.test.ts', 'client/tests/**/*.test.ts'],
    environment: 'node',
    setupFiles: ['./client/tests/setup.ts'],
  },
});
