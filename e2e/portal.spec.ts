import { expect, test, type Page } from '@playwright/test';
import { stubSanityEmpty } from './fixtures/sanity';
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
test('the board portal renders real member rows in Norwegian order', async ({ page }) => {
  const errors = collectPageErrors(page);
  await stubSupabase(page);

  await page.goto(BOARD_PORTAL);

  await expect(page.getByRole('heading', { level: 1, name: 'Velkommen, Ingrid!' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Medlemsliste' })).toBeVisible();

  /** One row is four cells; asserting all of them catches a column the query stopped returning. */
  const cellsFor = (surnames: string[]) =>
    surnames
      .map((surname) => MEMBERS.find((member) => member.surname === surname)!)
      .flatMap((member) => [member.name, member.surname, member.address, member.city]);

  // The list opens sorted by first name: Bjørn, Silje, Trygve.
  const cells = page.locator('p[lang="no"]');
  await expect(cells).toHaveText(cellsFor(['Aasen', 'Ødegård', 'Dahl']));

  await page.getByRole('button', { name: 'Etternavn' }).click();
  // Å last, and "Aa" collated as "Å" — so Aasen sorts *after* Ødegård, and the order is not the
  // one above. There is a unit test on the comparator; this is what proves the rendered list uses
  // it, over rows that came out of a query rather than out of a component's props.
  await expect(cells).toHaveText(cellsFor(['Dahl', 'Ødegård', 'Aasen']));

  await page.getByRole('button', { name: 'Navn', exact: true }).click();
  await expect(cells).toHaveText(cellsFor(['Aasen', 'Ødegård', 'Dahl']));

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

// The board portal has a second tier the member portal does not: a session that cannot read the
// member registry is not a login problem, so it falls back to the member portal instead of the
// fault screen. Collapsing the two would send a signed-in member back to a login page they are
// already past.
test('a board portal that cannot read the registry falls back to the member portal', async ({
  page,
}) => {
  await stubSupabase(page, { fail: { members: 403 } });

  await page.goto(BOARD_PORTAL);

  await expect(page).toHaveURL(`${MEMBER_PORTAL}?reason=not_admin`);
  await expect(page.getByRole('heading', { level: 1, name: 'Velkommen, Ingrid!' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Medlemsliste' })).toHaveCount(0);
  // #82: the fallback used to be silent. A non-admin now sees why they landed here.
  await expect(page.getByRole('alert')).toHaveText(
    'Du har ikke administratortilgang til styreportalen.',
  );
});

// #82's other tier: a registry failure that is *not* permission-related (an outage, say) must
// not be mislabelled as "you're not an admin" — it is a fault like any other loader failure.
test('a board portal registry failure that is not a permission denial is a fault, not a fallback', async ({
  page,
}) => {
  await stubSupabase(page, { fail: { members: 500 } });

  await page.goto(BOARD_PORTAL);

  await expect(page).toHaveURL(BOARD_PORTAL);
  await expect(page.getByRole('heading', { name: 'Noe gikk galt hos oss' })).toBeVisible();
});
