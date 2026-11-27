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
// The /redesign/ preview build: the same app with VITE_ENABLE_REDESIGN on, served separately so
// the flag is tested both off (every other spec) and on (e2e/redesign/).
const REDESIGN_PORT = 4174;

const SERVER_ENV = {
  VITE_BASE: '/',
  // A stub answers this origin; nothing is served from it. See e2e/fixtures/supabase-env.ts
  // for why it has to be a real https host rather than a localhost port.
  VITE_SUPABASE_URL: SUPABASE_URL,
  VITE_SUPABASE_PUBLISHABLE_KEY: SUPABASE_ANON_KEY,
  // The portal is hidden in production (#213); the smoke suite keeps it on so
  // portal.spec.ts, dialog.spec.ts and the login/register coverage below stay exercised.
  VITE_ENABLE_MEMBER_PORTAL: 'true',
  // The Kontakt oss form is hidden in production (#254); the smoke suite keeps it on so
  // its send-and-succeed path stays exercised.
  VITE_ENABLE_CONTACT_FORM: 'true',
  // On in production too, since the event pages were translated (#185).
  VITE_ENABLE_I18N: 'true',
};

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
    // A Norwegian visitor, the club's audience. With VITE_ENABLE_I18N on, the browser language
    // picks the first-visit locale, and Playwright's default (en-US) would make every spec an
    // English visit. Specs about English set it themselves.
    locale: 'nb-NO',
  },
  projects: [
    {
      name: 'chromium',
      testIgnore: 'redesign/**',
      use: {
        ...devices['Desktop Chrome'],
        // Remote dev environments preinstall Chromium at a build number that may
        // not match the pinned @playwright/test. Point at that binary when it is
        // present; fall back to Playwright's own download everywhere else.
        launchOptions: { executablePath: resolveChromium() },
      },
    },
    {
      name: 'redesign',
      testMatch: 'redesign/**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://localhost:${REDESIGN_PORT}`,
        launchOptions: { executablePath: resolveChromium() },
      },
    },
  ],
  webServer: [
    {
      // VITE_BASE=/ so the preview server serves from the root.
      command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
      url: `http://localhost:${PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      env: SERVER_ENV,
    },
    {
      // Its own output folder, so the two builds never overwrite each other. Typechecking is
      // left to the first build.
      command: `npx vite build --outDir dist-redesign && npx vite preview --outDir dist-redesign --port ${REDESIGN_PORT} --strictPort`,
      url: `http://localhost:${REDESIGN_PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      env: { ...SERVER_ENV, VITE_ENABLE_REDESIGN: 'true' },
    },
  ],
});
