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

  // A route with no <h1> gives a screen reader a `main` landmark with nothing naming it; a route
  // with two leaves it without a single answer to "what is this page". Six routes were in the
  // first state until #147 (they titled themselves with a <div>) and `/` was in the second until
  // #144 demoted the posts header to an <h2>, so this can now pin the exact count.
  test(`${route} renders exactly one document heading`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator('h1')).toHaveCount(1);
  });
}

// The routes still on `PagePlaceholder`. Each is one heading and nothing else, so the exact
// count is safe to pin here and is what stops the next stub shipping without one. `/våre-spill`
// and `/om-oss` left this list once they got a real page, and `/kontakt-oss` left it in #180 —
// see e2e/content.spec.ts and the dedicated Kontakt oss test below for their own coverage.
const placeholderRoutes = [
  { route: '/bli-medlem', heading: 'Bli medlem' },
  { route: '/våre-partnere', heading: 'Våre partnere' },
  { route: '/board-game-masters', heading: 'Board Game Masters' },
];

for (const { route, heading } of placeholderRoutes) {
  test(`${route} is a placeholder with one h1 and a way onward`, async ({ page }) => {
    await page.goto(route);

    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    // The point of the component: a live route a visitor lands on always offers somewhere useful.
    await expect(page.getByRole('button', { name: /Se kalender/ })).toBeVisible();
  });
}

// Every other test here stubs Sanity with an empty result, which means the list bodies never
// run: `events.map(...)` over `[]` renders nothing and cannot throw. That blind spot hid a crash
// on this page for every visitor who had an upcoming event to see — the projection returns
// `eventSlug`, the component read `slug.current`. Stub a populated result so the row actually
// renders.
test('arrangementer renders real rows, not just an empty list', async ({ page }) => {
  await page.route('**://*.sanity.io/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        result: [
          {
            _id: 'event-1',
            title: 'Spillkveld, torsdag 3. september',
            eventSlug: 'spillkveld-torsdag-3-september',
            eventStartTime: '2026-09-03T15:00:00Z',
            eventEndTime: '2026-09-03T21:30:00Z',
            category: 'spillkveld',
            location: 'Byhaugkafeen, Stavanger',
          },
        ],
      }),
    }),
  );

  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/arrangementer');

  const link = page.getByRole('link', { name: /Spillkveld, torsdag 3\. september/ });
  await expect(link).toBeVisible();
  // The href is the half that was broken: an undefined slug still renders a heading.
  await expect(link).toHaveAttribute('href', /\/arrangementer\/spillkveld-torsdag-3-september$/);
  // A missing field in the projection renders "Invalid Date" rather than throwing, so it needs
  // its own assertion.
  await expect(page.locator('li')).not.toContainText('Invalid Date');
  expect(errors, `page threw: ${errors.join(', ')}`).toEqual([]);
});

// #180: /kontakt-oss stopped being a PagePlaceholder. The default `stubBackends` answers
// `**://*.supabase.co/**` with `200 []`, which is enough for `createContactMessage`'s insert —
// it never chains `.select()`, so supabase-js treats any 2xx as success without needing a
// representation back.
test('kontakt-oss sends a message and shows the success notice', async ({ page }) => {
  await page.goto('/kontakt-oss');

  await expect(page.getByRole('heading', { level: 1, name: 'Kontakt oss!' })).toBeVisible();
  // Scoped to #main: the footer carries the same mailto link on every page.
  await expect(page.locator('#main').getByRole('link', { name: 'hei@sbsk.no' })).toHaveAttribute(
    'href',
    'mailto:hei@sbsk.no',
  );

  // Send stays disabled until every field is valid (#203), so an empty form is caught by
  // blurring a required field rather than by a submit attempt.
  await expect(page.getByRole('button', { name: 'Send melding' })).toBeDisabled();
  await page.getByPlaceholder('Ditt navn').click();
  await page.getByPlaceholder('deg@epost.no').click();
  await expect(page.getByText('Navn må være minst 2 tegn')).toBeVisible();

  await page.getByPlaceholder('Ditt navn').fill('Ola Nordmann');
  await page.getByPlaceholder('deg@epost.no').fill('ola@epost.no');
  await page.getByPlaceholder('Skriv din melding her...').fill('Hei, jeg har et spørsmål.');
  await expect(page.getByRole('button', { name: 'Send melding' })).toBeEnabled();
  await page.getByRole('button', { name: 'Send melding' }).click();

  await expect(page.getByRole('status')).toHaveText(
    'Meldingen din er sendt. Vi svarer så snart vi kan.',
  );
});

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
