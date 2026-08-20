import { expect, test, type Page } from '@playwright/test';
import {
  POSTS,
  UPCOMING_EVENT,
  UPCOMING_TOURNAMENT,
  PAST_EVENT,
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
