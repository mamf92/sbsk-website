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
      // The portal is hidden in production (#213); tests keep it on so the gated routes and
      // components stay covered.
      VITE_ENABLE_MEMBER_PORTAL: 'true',
      // Same deal for the Kontakt oss form (#254): hidden in production, on here so the form
      // and its validation stay covered. `ContactSection.test.tsx` mocks the flag off to
      // cover the email-only state the site actually ships.
      VITE_ENABLE_CONTACT_FORM: 'true',
    },
    setupFiles: ['./src/test/setup.ts'],
    // Setting `exclude` replaces vitest's defaults rather than extending them,
    // so the node_modules glob has to be recursive: a bare `node_modules/**`
    // misses nested checkouts such as .claude/worktrees/*/node_modules, and
    // vitest then runs our dependencies' own test suites.
    // Playwright specs use their own runner; keep them out of vitest too.
    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**', '.claude/worktrees/**'],
  },
});
