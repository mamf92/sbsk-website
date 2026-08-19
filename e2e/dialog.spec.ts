import { expect, test, type Page } from '@playwright/test';

/**
 * #149: `Dialog` is built on the native `<dialog>` and `showModal()`, and everything that
 * buys — the focus trap, Escape, the top layer, inertness of the page behind — exists only
 * in a real browser. jsdom implements none of it (`src/test/setup.ts` polyfills just enough
 * of the element to mount), so the contract that actually matters is checked here.
 *
 * The board portal is the shortest route to a live dialog. It is behind a Supabase session,
 * so the session and the two queries the loader makes are stubbed below — no network.
 */

const SUPABASE = 'http://localhost:54321';
const USER_ID = '00000000-0000-0000-0000-000000000001';

const user = {
  id: USER_ID,
  aud: 'authenticated',
  role: 'authenticated',
  email: 'styret@sbsk.test',
  app_metadata: {},
  user_metadata: {},
  created_at: '2024-01-01T00:00:00Z',
};

const profile = {
  id: 'p1',
  supabase_id: USER_ID,
  email: 'styret@sbsk.test',
  name: 'Kari',
  surname: 'Nordmann',
  address: 'Storgata 1',
  postcode: '4005',
  city: 'Stavanger',
  created_at: '2024-01-01T00:00:00Z',
  photo_url: null,
  bio: null,
};

const members = [
  {
    id: 'm1',
    name: 'Ola',
    surname: 'Nordmann',
    phone: '40000000',
    address: 'Storgata 2',
    postcode: '4005',
    city: 'Stavanger',
    email: 'ola@sbsk.test',
    is_admin: false,
  },
];

async function signInAndStub(page: Page) {
  // supabase-js keys its session off the project URL's first hostname label.
  await page.addInitScript(
    ([key, session]) => window.localStorage.setItem(key as string, session as string),
    [
      'sb-localhost-auth-token',
      JSON.stringify({
        access_token: 'stub-access-token',
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        refresh_token: 'stub-refresh-token',
        user,
      }),
    ],
  );

  const json = (body: unknown) => ({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });

  await page.route(`${SUPABASE}/auth/v1/user*`, (route) => route.fulfill(json(user)));
  // `.single()` asks PostgREST for an object rather than an array.
  await page.route(`${SUPABASE}/rest/v1/profiles*`, (route) => route.fulfill(json(profile)));
  await page.route(`${SUPABASE}/rest/v1/members*`, (route) => route.fulfill(json(members)));
  await page.route(`${SUPABASE}/**`, (route) => route.fulfill(json([])));
  await page.route('**://*.sanity.io/**', (route) => route.fulfill(json({ result: [] })));
}

test.beforeEach(async ({ page }) => {
  await signInAndStub(page);
});

test('the member dialog traps focus, closes on Escape and restores focus', async ({ page }) => {
  await page.goto('/styreportal');

  const opener = page.getByRole('button', { name: 'Legg til medlem' }).first();
  await expect(opener).toBeVisible();
  await opener.click();

  const dialog = page.getByRole('dialog', { name: 'Legg til medlem' });
  await expect(dialog).toBeVisible();

  // `showModal()` moves focus into the dialog rather than leaving it on the opener.
  await expect
    .poll(() => page.evaluate(() => document.activeElement?.closest('dialog') !== null))
    .toBe(true);

  // Tab far past the number of focusable controls in the form. Without a trap this walks
  // out into the page behind, which is what the two hand-rolled overlays used to do.
  //
  // `body` is an allowed landing spot and not a leak: Chromium's tab cycle inside a modal
  // dialog hops through the browser chrome, and headless has none, so the document itself
  // takes focus for one step before the cycle re-enters the dialog. What must never happen
  // is a *focusable element behind the dialog* taking focus.
  for (let i = 0; i < 20; i += 1) {
    await page.keyboard.press('Tab');
    const landing = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body || el === document.documentElement) return 'document';
      return el.closest('dialog') ? 'dialog' : `behind: ${el.tagName}.${el.className}`;
    });
    expect(landing).not.toContain('behind');
  }

  // The page behind is genuinely inert, not just visually covered: a hit test at the
  // opener's own centre lands on the backdrop, never on the button.
  const opensHitTest = await page.evaluate(() => {
    const button = [...document.querySelectorAll('button')].find(
      (b) => b.textContent?.trim().startsWith('Legg til medlem') && !b.closest('dialog'),
    );
    if (!button) return 'no opener found';
    const box = button.getBoundingClientRect();
    const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
    return hit === button ? 'reachable' : 'blocked';
  });
  expect(opensHitTest).toBe('blocked');

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();

  // Focus returns to the button that opened it, which the native element only does while the
  // opener is still in the document — `Dialog` restores it explicitly.
  await expect(opener).toBeFocused();
});

test('the page behind the dialog does not scroll', async ({ page }) => {
  await page.goto('/styreportal');

  await page.getByRole('button', { name: 'Legg til medlem' }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();

  expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).toBe('hidden');

  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).not.toBe('hidden');
});
