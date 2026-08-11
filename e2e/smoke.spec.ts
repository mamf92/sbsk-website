import { expect, test, type Page } from '@playwright/test';

// Sandboxed environments have no route to Sanity or Supabase, and CI should not
// depend on live content anyway. Every backend call is stubbed with an empty
// result so the app falls back to its built-in copy.
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

test.beforeEach(async ({ page }) => {
  await stubBackends(page);
});

test('home page renders the hero fallback copy', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Stavanger Brettspillklubb' })).toBeVisible();
});

test('header navigates to a Norwegian non-ASCII route', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('link', { name: 'Våre spill' }).first().click();

  // Guards the encoded-path round-trip between the router and the links.
  await expect(page).toHaveURL(/(v%C3%A5re-spill|våre-spill)/);
  await expect(page.locator('#main')).not.toBeEmpty();
});

test('deep-linking straight into a route works', async ({ page }) => {
  await page.goto('/kalender');
  await expect(page.locator('#main')).not.toBeEmpty();
  await expect(page.locator('header')).toBeVisible();
});

// Every page renders inside the shell's single <main> in App.tsx. A page that
// wraps its own content in a second <main> produces nested landmarks and breaks
// the "skip to content" link. Walk the static routes and assert one main each.
const singleMainRoutes = [
  '/',
  '/board-game-masters',
  '/våre-spill',
  '/om-oss',
  '/kontakt-oss',
  '/bli-medlem',
  '/arrangementer',
  '/våre-partnere',
  '/lag-medlemsprofil',
  '/login',
];

for (const route of singleMainRoutes) {
  test(`${route} renders exactly one main landmark`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator('main')).toHaveCount(1);
  });
}

test('unknown routes render the 404 page, not a blank screen', async ({ page }) => {
  await page.goto('/denne-siden-finnes-ikke');

  await expect(page.locator('#main')).not.toBeEmpty();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Denne siden mangler i esken' }),
  ).toBeVisible();
  // Exactly one <h1>, and only the shell's <main> — the page must not nest a second one.
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('main')).toHaveCount(1);
  // The header and footer must survive a 404 so the user can navigate away.
  await expect(page.locator('header')).toBeVisible();
  await expect(page.locator('footer')).toBeVisible();

  // The way back to the front page is part of the contract, not decoration.
  await page.getByRole('button', { name: 'Til forsiden' }).click();
  await expect(page).toHaveURL(/\/(sbsk-website\/)?$/);
});

test('theme toggle flips the dark class and survives a reload', async ({ page }) => {
  await page.goto('/');

  const html = page.locator('html');
  const startedDark = await html.evaluate((el) => el.classList.contains('dark'));

  await page
    .getByRole('button', { name: /Bytt til (lys|mørk) modus/ })
    .first()
    .click();
  await expect(html).toHaveClass(startedDark ? /^(?!.*\bdark\b).*$/ : /\bdark\b/);

  await page.reload();
  await expect(html).toHaveClass(startedDark ? /^(?!.*\bdark\b).*$/ : /\bdark\b/);
});

test('the public entry bundle does not pull in the Sanity Studio', async ({ page }) => {
  const scripts: string[] = [];
  page.on('request', (request) => {
    if (request.resourceType() === 'script') scripts.push(request.url());
  });

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Stavanger Brettspillklubb' })).toBeVisible();

  // The Studio is several MB. If it is ever imported eagerly again, its chunks
  // show up in the initial page load and this fails.
  const studioChunks = scripts.filter((url) => /structureTool|SanityVision/.test(url));
  expect(studioChunks, `unexpected Studio chunks: ${studioChunks.join(', ')}`).toHaveLength(0);
});
