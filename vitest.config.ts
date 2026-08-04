import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
  plugins: [react(), svgr()],
  test: {
    environment: 'jsdom',
    globals: true,
    // Placeholders so modules that construct a Supabase client at import time
    // load under test. Tests must mock the query helpers, never hit a network.
    env: {
      VITE_SUPABASE_URL: 'http://localhost:54321',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'test-anon-key',
    },
    setupFiles: ['./src/test/setup.ts'],
    // Playwright specs use their own runner; keep them out of vitest.
    exclude: ['node_modules/**', 'dist/**', 'e2e/**'],
  },
});
