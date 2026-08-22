import { existsSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './e2e/fixtures/supabase-env';

function resolveChromium(): string | undefined {
  const candidates = [process.env.PLAYWRIGHT_CHROMIUM_PATH, '/opt/pw-browsers/chromium'].filter(
    (path): path is string => Boolean(path),
  );

  return candidates.find((path) => existsSync(path));
}

// The smoke suite runs against a real production build so it catches base-path,
// router-basename and code-splitting mistakes that unit tests cannot see.
const PORT = 4173;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Remote dev environments preinstall Chromium at a build number that may
        // not match the pinned @playwright/test. Point at that binary when it is
        // present; fall back to Playwright's own download everywhere else.
        launchOptions: { executablePath: resolveChromium() },
      },
    },
  ],
  webServer: {
    // VITE_BASE=/ so the preview server serves from the root.
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      VITE_BASE: '/',
      // A stub answers this origin; nothing is served from it. See e2e/fixtures/supabase-env.ts
      // for why it has to be a real https host rather than a localhost port.
      VITE_SUPABASE_URL: SUPABASE_URL,
      VITE_SUPABASE_PUBLISHABLE_KEY: SUPABASE_ANON_KEY,
    },
  },
});
