import { expect, test, type Page } from '@playwright/test';
import {
  FESTIVAL_BGM,
  stubSanityEmpty,
  stubSanityWithContent,
  UPCOMING_EVENT,
} from './fixtures/sanity';
import { MEMBERS, stubSupabase } from './fixtures/supabase';

// The two portal routes, in a real browser, with a real session.
//
// Until this file, the only thing that had ever reached one of them was dialog.spec.ts, which
// signs in to get at a live <dialog> and asserts nothing about the loaders themselves. Every
// failure mode was untested: both loaders redirect to /login without a session, and #163 routed
// their faults to the shared error boundary — an improvement nothing could see.
//
// See e2e/fixtures/supabase.ts for how the session is faked without an account or a credential.

const MEMBER_PORTAL = '/medlemsportal';
const BOARD_PORTAL = '/styreportal';

/** Uncaught render faults do not fail a Playwright test on their own; collected, they can. */
function collectPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

test.beforeEach(async ({ page }) => {
  // The portals render no Sanity content, but the shell around them must not reach for any.
  await stubSanityEmpty(page);
});

for (const route of [MEMBER_PORTAL, BOARD_PORTAL]) {
  test(`${route} sends a signed-out visitor to login`, async ({ page }) => {
    await stubSupabase(page, { signedIn: false });

    await page.goto(route);

    await expect(page).toHaveURL(/\/login\?reason=not_authenticated$/);
    // The reason is not decoration: it is what tells a visitor why they are looking at a login
    // form they did not ask for.
    await expect(page.getByText('Det ser ut som at du ikke er logget inn.')).toBeVisible();
  });

  test(`${route} sends a visitor with a rejected session to login`, async ({ page }) => {
    // A stored session the backend refuses — expired, or signed out from another tab. The token
    // is in localStorage either way, so only the server's answer separates this from a real one.
    await stubSupabase(page, { authStatus: 401 });

    await page.goto(route);

    await expect(page).toHaveURL(/\/login\?reason=not_authenticated$/);
  });
}

test('the member portal renders the signed-in member profile', async ({ page }) => {
  const errors = collectPageErrors(page);
  await stubSupabase(page);

  await page.goto(MEMBER_PORTAL);

  await expect(page.getByRole('heading', { level: 1, name: 'Velkommen, Ingrid!' })).toBeVisible();
  await expect(page.getByText('Styremedlem og turneringsansvarlig.')).toBeVisible();
  // The same landmark contract the rest of the suite holds every public route to.
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveCount(1);
  expect(errors, `page threw: ${errors.join(', ')}`).toEqual([]);
});

// #162 closed this hole for Sanity and left it open for Supabase: `getMembers()` was stubbed `[]`,
// so the list body never ran. An empty list renders nothing and cannot throw — which is exactly
// how #160 shipped a page that crashed on every real row while CI stayed green.
test('the board portal opens on the overview, with the register summarised', async ({ page }) => {
  const errors = collectPageErrors(page);
  // Real content, so the festival's localised title reaches the events panel.
  await stubSanityWithContent(page);
  await stubSupabase(page);

  await page.goto(BOARD_PORTAL);

  await expect(page.getByRole('heading', { level: 1, name: 'Hei, Ingrid!' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Styreportal' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Oversikt' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  const events = page.getByRole('region', { name: 'Kommende arrangementer' });
  await expect(events.getByText(FESTIVAL_BGM.title.nb).first()).toBeVisible();
  await expect(events.getByText(UPCOMING_EVENT.title).first()).toBeVisible();
  // Three active members, one of whom (Trygve) has paid this season.
  const summary = page.getByRole('region', { name: 'Medlemmer' });
  await expect(summary.getByRole('link', { name: /^3\s*Aktive$/ })).toBeVisible();
  await expect(summary.getByRole('link', { name: /^2\s*Ikke betalt/ })).toBeVisible();
  await expect(summary.getByRole('link', { name: 'Send betalingspåminnelse (2)' })).toBeVisible();
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveCount(1);
  expect(errors, `page threw: ${errors.join(', ')}`).toEqual([]);
});

test('the members tab renders real rows in Norwegian order, filtered from the URL', async ({
  page,
}) => {
  const errors = collectPageErrors(page);
  await stubSupabase(page);

  await page.goto(`${BOARD_PORTAL}/medlemmer`);

  const rows = page.getByRole('list', { name: 'Medlemmer' }).getByRole('listitem');
  // By first name, Norwegian collation: Bjørn, Silje, Trygve. Every column the query returns is
  // on the row, so a column it stops returning shows up here.
  await expect(rows).toHaveCount(3);
  for (const [index, surname] of ['Aasen', 'Ødegård', 'Dahl'].entries()) {
    const member = MEMBERS.find((m) => m.surname === surname)!;
    const row = rows.nth(index);
    await expect(row).toHaveAccessibleName(`${member.name} ${member.surname}`);
    await expect(row).toContainText(member.email);
    await expect(row).toContainText(member.phone);
  }
  await expect(rows.nth(2)).toContainText(`Betalt ${new Date().getFullYear()}`);

  // The overview's "Ikke betalt" number links here with the filter in the URL.
  await page.goto(`${BOARD_PORTAL}/medlemmer?betalt=nei`);
  await expect(rows).toHaveCount(2);
  await expect(page.getByRole('button', { name: /^Ikke betalt/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  expect(errors, `page threw: ${errors.join(', ')}`).toEqual([]);
});

test('door check-in: pick the event, then find members to check in', async ({ page }) => {
  const errors = collectPageErrors(page);
  // A later route wins, so this replaces the empty Sanity stub from beforeEach.
  await stubSanityWithContent(page);
  await stubSupabase(page);

  await page.goto(`${BOARD_PORTAL}/innsjekk`);
  await page.getByRole('link', { name: new RegExp(UPCOMING_EVENT.title) }).click();

  await expect(page).toHaveURL(`${BOARD_PORTAL}/innsjekk/${UPCOMING_EVENT._id}`);
  await expect(page.getByRole('heading', { level: 2, name: UPCOMING_EVENT.title })).toBeVisible();
  const search = page.getByRole('searchbox', { name: 'Søk etter medlem' });
  await expect(search).toBeFocused();
  await search.fill('silje');
  await expect(page.getByRole('button', { name: 'Sjekk inn Silje Ødegård' })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Sjekk inn/ })).toHaveCount(1);
  expect(errors, `page threw: ${errors.join(', ')}`).toEqual([]);
});

test('a failing profile query renders the fault screen, not a developer stack trace', async ({
  page,
}) => {
  await stubSupabase(page, { fail: { profiles: 500 } });

  await page.goto(MEMBER_PORTAL);

  // What #163 put here. Before it, a rejected loader fell through to React Router's own screen.
  await expect(page.getByRole('heading', { name: 'Noe gikk galt hos oss' })).toBeVisible();
  // The whole point of hanging the boundary on the child route: the visitor can still leave.
  await expect(page.locator('header')).toBeVisible();
  await expect(page.locator('footer')).toBeVisible();
  // And it must not blame the visitor for our outage by bouncing them to login.
  await expect(page).toHaveURL(new RegExp(`${MEMBER_PORTAL}$`));
});

test('a profile row that does not exist is a fault, not an empty portal', async ({ page }) => {
  // PostgREST answers `.single()` over zero rows with PGRST116, which supabase-js turns into an
  // error — so a member whose profile row is missing gets the fault screen rather than a portal
  // rendering `undefined` into every field.
  await stubSupabase(page, { profiles: [] });

  await page.goto(MEMBER_PORTAL);

  await expect(page.getByRole('heading', { name: 'Noe gikk galt hos oss' })).toBeVisible();
});

test('retrying after a blip re-runs the loader and shows the portal', async ({ page }) => {
  await stubSupabase(page, { fail: { profiles: 500 } });
  await page.goto(MEMBER_PORTAL);
  await expect(page.getByRole('heading', { name: 'Noe gikk galt hos oss' })).toBeVisible();

  // Backend recovers. A later route takes precedence over the failing one.
  await stubSupabase(page);
  await page.getByRole('button', { name: 'Prøv igjen' }).click();

  // Revalidating rather than reloading is the behaviour under test: the visitor keeps their
  // place, and the loader runs again against a backend that now answers.
  await expect(page.getByRole('heading', { level: 1, name: 'Velkommen, Ingrid!' })).toBeVisible();
});

// The board portal's gate (src/loaders/requireAdminSession.ts). A signed-in member is not a login
// problem, so they fall back to the member portal with a reason; an admin who has not entered
// their second-factor code is sent to enter it.
test('a member who is not an admin falls back to the member portal', async ({ page }) => {
  await stubSupabase(page, { isAdmin: false });

  await page.goto(BOARD_PORTAL);

  await expect(page).toHaveURL(`${MEMBER_PORTAL}?reason=not_admin`);
  await expect(page.getByRole('heading', { level: 1, name: 'Velkommen, Ingrid!' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Styreportal' })).toHaveCount(0);
  // #82: the fallback used to be silent. A non-admin now sees why they landed here.
  await expect(page.getByRole('alert')).toHaveText(
    'Du har ikke administratortilgang til styreportalen.',
  );
});

test('an admin who has not entered their code is asked for it', async ({ page }) => {
  await stubSupabase(page, { aal: 'aal1', hasFactor: true });

  await page.goto(BOARD_PORTAL);

  await expect(page).toHaveURL(/\/to-faktor\?neste=%2Fstyreportal$/);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Bekreft at det er deg' }),
  ).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Sekssifret kode' })).toBeFocused();
});

test('a board portal registry failure is a fault, not a fallback', async ({ page }) => {
  await stubSupabase(page, { fail: { members: 500 } });

  await page.goto(BOARD_PORTAL);

  await expect(page).toHaveURL(BOARD_PORTAL);
  await expect(page.getByRole('heading', { name: 'Noe gikk galt hos oss' })).toBeVisible();
});
