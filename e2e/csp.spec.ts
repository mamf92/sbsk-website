import { expect, test, type Page } from '@playwright/test';

// The Content-Security-Policy is a static meta element (GitHub Pages cannot send headers), which
// means nothing about it is enforced at build time: a stray CDN <script>, an external font or a
// new backend host fails in the browser and nowhere else. These tests are that missing gate.

async function stubBackends(page: Page) {
  await page.route('**://*.sanity.io/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ result: [] }),
    }),
  );
  await page.route('**://*.supabase.co/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  );
}

/** Records violations from the page itself; a blocked request never reaches Playwright's router. */
async function collectViolations(page: Page): Promise<() => Promise<string[]>> {
  await page.addInitScript(() => {
    const seen: string[] = [];
    (window as unknown as { __cspViolations: string[] }).__cspViolations = seen;
    document.addEventListener('securitypolicyviolation', (event) => {
      seen.push(`${event.effectiveDirective} blocked ${event.blockedURI}`);
    });
  });

  return () =>
    page.evaluate(
      () => (window as unknown as { __cspViolations?: string[] }).__cspViolations ?? [],
    );
}

test('the policy ships in the built HTML and is not accidentally permissive', async ({ page }) => {
  await stubBackends(page);
  await page.goto('/');

  const policy = await page
    .locator('meta[http-equiv="Content-Security-Policy"]')
    .getAttribute('content');

  expect(policy).toBeTruthy();
  expect(policy).toContain("default-src 'self'");
  expect(policy).toContain("object-src 'none'");
  expect(policy).toContain("base-uri 'self'");

  // The production bundle has no inline or generated script. If a change makes one necessary,
  // that is a decision to take deliberately rather than by loosening the policy to keep a build
  // green — which is what this assertion exists to force.
  expect(policy).toContain("script-src 'self'");
  expect(policy).not.toContain('unsafe-eval');

  // frame-ancestors, report-uri and sandbox are ignored in meta and log a console warning.
  expect(policy).not.toContain('frame-ancestors');
  expect(policy).not.toContain('report-uri');
});

const routes = [
  '/',
  '/kalender',
  '/arrangementer',
  '/om-oss',
  '/våre-spill',
  '/kontakt-oss',
  '/bli-medlem',
  '/våre-partnere',
  '/board-game-masters',
  '/login',
  '/lag-medlemsprofil',
  '/denne-siden-finnes-ikke',
];

for (const route of routes) {
  test(`${route} loads with no CSP violation`, async ({ page }) => {
    const violations = await collectViolations(page);
    await stubBackends(page);

    await page.goto(route);
    await expect(page.locator('#main')).not.toBeEmpty();

    expect(await violations()).toEqual([]);
  });
}

// The Studio is the reason two directives are open at all: it writes <style> elements at runtime
// and builds workers from blob URLs. It shares the one policy the document gets, so it is also the
// most likely thing to break under it.
test('/studio mounts under the same policy', async ({ page }) => {
  const violations = await collectViolations(page);
  await stubBackends(page);

  await page.goto('/studio');

  // Anything Sanity-rendered proves the lazy chunk loaded and styled itself under `script-src
  // 'self'` and `style-src 'unsafe-inline'`. Without a real backend it gets no further than this.
  await expect(page.locator('[data-sanity-icon], [data-ui]').first()).toBeVisible({
    timeout: 30_000,
  });

  expect(await violations()).toEqual([]);
});
