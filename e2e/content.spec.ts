import { expect, test, type Page } from '@playwright/test';
import {
  POSTS,
  UPCOMING_EVENT,
  UPCOMING_TOURNAMENT,
  PAST_EVENT,
  ABOUT_PAGE,
  BOARD_MEMBER,
  stubSanityWithContent,
} from './fixtures/sanity';

// The suite's other specs stub Sanity empty, which is a real state but not the common one. These
// load the same pages with content in them, so the list bodies, the filters and the date
// formatting all execute against the shape the GROQ projections actually return.

/** Fails the test on any uncaught error, which is how a bad field access surfaces. */
function watchForErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

test.beforeEach(async ({ page }) => {
  await stubSanityWithContent(page);
  await page.route('**://*.supabase.co/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  );
});

test('the front page renders the posts feed rather than its empty state', async ({ page }) => {
  const errors = watchForErrors(page);

  await page.goto('/');

  for (const post of POSTS) {
    await expect(page.getByRole('heading', { name: post.title })).toBeVisible();
  }
  // The assertion that fails under an empty stub: PostsSection returns this instead of the feed
  // whenever `posts.length === 0`, so every previous check of this page was checking that.
  await expect(page.getByText('Ingen innlegg', { exact: true })).toHaveCount(0);
  // A field missing from the projection reaches the page as `Invalid Date`, not as a crash.
  await expect(page.locator('body')).not.toContainText('Invalid Date');
  expect(errors, `page threw: ${errors.join(', ')}`).toEqual([]);
});

test('searching the posts feed narrows it to the matching post', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('searchbox', { name: 'Søk etter innlegg' }).fill('frivillige');

  await expect(page.getByRole('heading', { name: 'Turneringen trenger frivillige' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Høstprogrammet er klart' })).toHaveCount(0);
});

test('filtering the posts feed by category keeps only that category', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'nyheter' }).click();

  await expect(page.getByRole('heading', { name: 'Høstprogrammet er klart' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Fullt hus på siste spillkveld' })).toHaveCount(0);
});

test('a search matching nothing offers a way back rather than a blank list', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('searchbox', { name: 'Søk etter innlegg' }).fill('zzzznomatch');
  await expect(page.getByText('Ingen innlegg matcher søket.')).toBeVisible();

  await page.getByRole('button', { name: 'Fjern filtre' }).click();
  await expect(page.getByRole('heading', { name: POSTS[0].title })).toBeVisible();
});

test('the calendar renders upcoming events with their times and places', async ({ page }) => {
  const errors = watchForErrors(page);

  await page.goto('/kalender');

  await expect(page.getByRole('heading', { name: UPCOMING_EVENT.title })).toBeVisible();
  await expect(page.getByRole('heading', { name: UPCOMING_TOURNAMENT.title })).toBeVisible();
  // The soonest event is singled out, which only happens once real dates are compared.
  await expect(page.getByText('NESTE ARRANGEMENT')).toBeVisible();
  await expect(page.getByText(UPCOMING_EVENT.location).first()).toBeVisible();
  await expect(page.locator('body')).not.toContainText('Invalid Date');
  expect(errors, `page threw: ${errors.join(', ')}`).toEqual([]);
});

test('the calendar scope filter separates past events from upcoming ones', async ({ page }) => {
  await page.goto('/kalender');

  // Default scope is upcoming, so a finished event must not be in the list yet.
  await expect(page.getByRole('heading', { name: PAST_EVENT.title })).toHaveCount(0);

  await page.getByRole('button', { name: 'Tidligere' }).click();

  await expect(page.getByRole('heading', { name: PAST_EVENT.title })).toBeVisible();
  await expect(page.getByRole('heading', { name: UPCOMING_EVENT.title })).toHaveCount(0);
});

test('the calendar category filter keeps only the chosen category', async ({ page }) => {
  await page.goto('/kalender');

  await page.getByRole('button', { name: 'Turnering', exact: true }).click();

  await expect(page.getByRole('heading', { name: UPCOMING_TOURNAMENT.title })).toBeVisible();
  await expect(page.getByRole('heading', { name: UPCOMING_EVENT.title })).toHaveCount(0);
});

test('the games page renders the real collection rather than the local fallback', async ({
  page,
}) => {
  const errors = watchForErrors(page);

  await page.goto('/våre-spill');

  await expect(page.getByRole('heading', { name: 'Testkveld' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Storgruppe' })).toBeVisible();
  // `OurGamesSection` only reaches for its bundled fallback when Sanity returns nothing —
  // seeing the fallback's "Wingspan" here would mean the real games never rendered.
  await expect(page.getByRole('heading', { name: 'Wingspan' })).toHaveCount(0);
  expect(errors, `page threw: ${errors.join(', ')}`).toEqual([]);
});

test('searching the games list narrows it by title', async ({ page }) => {
  await page.goto('/våre-spill');

  await page.getByRole('searchbox', { name: 'Søk etter spill' }).fill('storgruppe');

  await expect(page.getByRole('heading', { name: 'Storgruppe' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Testkveld' })).toHaveCount(0);
});

test('filtering the games list by difficulty keeps only that difficulty', async ({ page }) => {
  await page.goto('/våre-spill');

  await page.getByRole('button', { name: 'Vanskelig' }).click();

  await expect(page.getByRole('heading', { name: 'Storgruppe' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Testkveld' })).toHaveCount(0);
});

test('a games search matching nothing offers a way back rather than a blank grid', async ({
  page,
}) => {
  await page.goto('/våre-spill');

  await page.getByRole('searchbox', { name: 'Søk etter spill' }).fill('zzzznomatch');
  await expect(page.getByText('Ingen spill matcher søket')).toBeVisible();

  await page.getByRole('button', { name: 'Fjern filtre' }).click();
  await expect(page.getByRole('heading', { name: 'Testkveld' })).toBeVisible();
});

test('the om oss page renders the real board rather than the local fallback', async ({ page }) => {
  const errors = watchForErrors(page);

  await page.goto('/om-oss');

  await expect(page.getByRole('heading', { level: 1, name: ABOUT_PAGE.clubTitle })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: ABOUT_PAGE.boardTitle })).toBeVisible();
  await expect(page.getByRole('heading', { name: BOARD_MEMBER.name })).toBeVisible();
  await expect(page.getByText(BOARD_MEMBER.role)).toBeVisible();
  // `AboutUsSection` only reaches for its bundled fallback when Sanity returns no members —
  // seeing "Astrid Lindgren" here would mean the real board never rendered.
  await expect(page.getByText('Astrid Lindgren')).toHaveCount(0);
  expect(errors, `page threw: ${errors.join(', ')}`).toEqual([]);
});

// eventDetailLoader has never run in this suite: reaching it needs a slug, and an empty stub
// never produces one.
test('an event links through to its own page', async ({ page }) => {
  const errors = watchForErrors(page);

  await page.goto('/arrangementer');
  await page.getByRole('link', { name: UPCOMING_EVENT.title }).click();

  await expect(page).toHaveURL(new RegExp(`/arrangementer/${UPCOMING_EVENT.slug.current}$`));
  await expect(page.getByRole('heading', { level: 1, name: UPCOMING_EVENT.title })).toBeVisible();
  expect(errors, `page threw: ${errors.join(', ')}`).toEqual([]);
});

// --- #63: what a visitor gets when something goes wrong -----------------------------------

test('an event slug that does not resolve renders the 404 page inside the shell', async ({
  page,
}) => {
  await page.goto('/arrangementer/finnes-ikke');

  // eventDetailLoader throws a 404 Response. Without a boundary that produced React Router's
  // developer error screen, stack trace and all, with no way to navigate away.
  await expect(page.getByRole('heading', { name: 'Denne siden mangler i esken' })).toBeVisible();
  // The shell has to survive, or the visitor is stranded.
  await expect(page.locator('header')).toBeVisible();
  await expect(page.locator('footer')).toBeVisible();

  await page.getByRole('button', { name: 'Til forsiden' }).click();
  await expect(page).toHaveURL(/\/(sbsk-website\/)?$/);
});

test('a backend failure is reported as a fault, not as a missing page', async ({ page }) => {
  // Override the content stub: this is Sanity being unreachable, not a slug that does not exist.
  await page.route('**://*.sanity.io/**', (route) => route.abort('failed'));

  await page.goto('/arrangementer');

  await expect(page.getByRole('heading', { name: 'Noe gikk galt hos oss' })).toBeVisible();
  // Telling someone the page does not exist when our backend fell over sends them away for good.
  await expect(page.getByText('Denne siden mangler i esken')).toHaveCount(0);
  await expect(page.locator('header')).toBeVisible();
});

test('the front page survives losing one of its two content sources', async ({ page }) => {
  // The hero query fails; the posts query is left alone.
  await page.route('**://*.sanity.io/**', async (route) => {
    const query = new URL(route.request().url()).searchParams.get('query') ?? '';
    if (query.includes('"homeHero"')) return route.abort('failed');
    return route.fallback();
  });

  await page.goto('/');

  // The feed still renders, and the hero falls back to its built-in copy rather than taking the
  // page with it.
  await expect(page.getByRole('heading', { name: POSTS[0].title })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Noe gikk galt hos oss' })).toHaveCount(0);
});

test('an unreachable feed says so rather than claiming there are no posts', async ({ page }) => {
  await page.route('**://*.sanity.io/**', async (route) => {
    const query = new URL(route.request().url()).searchParams.get('query') ?? '';
    if (query.includes('"post"')) return route.abort('failed');
    return route.fallback();
  });

  await page.goto('/');

  await expect(page.getByText('Kunne ikke laste innlegg')).toBeVisible();
  // "Ingen innlegg" would be a lie, and one that reads as "this club has gone quiet".
  await expect(page.getByText('Ingen innlegg', { exact: true })).toHaveCount(0);
});
