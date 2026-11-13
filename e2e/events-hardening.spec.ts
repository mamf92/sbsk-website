import { expect, test, type Page } from '@playwright/test';
import {
  DATASET,
  FESTIVAL_BGM,
  MALICIOUS_EVENT,
  UPCOMING_TOURNAMENT,
  stubSanityWithContent,
} from './fixtures/sanity';

// Phase 1's closing checks (docs/plans/01-event-pages.md, WP8): the cases the per-page specs
// leave out because they cut across pages: hostile content, a calendar-only event, the clock
// and the visitor's own time zone.

test.beforeEach(async ({ page }) => {
  await page.route('**://*.supabase.co/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  );
});

test('a calendar-only event has no page of its own', async ({ page }) => {
  await stubSanityWithContent(page);
  await page.goto(`/arrangementer/${UPCOMING_TOURNAMENT.slug.current}`);
  await expect(page.getByRole('heading', { name: 'Denne siden mangler i esken' })).toBeVisible();
});

test('hostile links in an event are dropped, and nothing runs', async ({ page }) => {
  const dialogs: string[] = [];
  page.on('dialog', (dialog) => {
    dialogs.push(dialog.message());
    void dialog.dismiss();
  });
  await stubSanityWithContent(page, [...DATASET, MALICIOUS_EVENT]);

  // The event page: rich text, sign-up and sponsors.
  await page.goto(`/arrangementer/${MALICIOUS_EVENT.slug.current}`);
  await expect(page.getByRole('heading', { level: 1, name: MALICIOUS_EVENT.title })).toBeVisible();
  // The text stays; only the link is gone.
  await expect(page.getByText('Klikk her')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Klikk her' })).toHaveCount(0);
  // An unsafe sign-up URL counts as no sign-up: no button that would open it.
  await expect(page.getByRole('button', { name: 'Meld deg på' })).toHaveCount(0);
  // The sponsor still shows, without its link.
  await expect(page.getByText('Farlig sponsor').first()).toBeVisible();
  await expect(page.getByRole('link', { name: /Farlig sponsor/ })).toHaveCount(0);
  await expectNoUnsafeHrefs(page);

  // The calendar row draws the event's link buttons.
  await page.goto('/kalender');
  await page.getByRole('heading', { name: MALICIOUS_EVENT.title }).click();
  await expect(page.getByText('Farlig knapp')).toHaveCount(0);
  await expectNoUnsafeHrefs(page);

  expect(dialogs).toEqual([]);
});

async function expectNoUnsafeHrefs(page: Page) {
  const hrefs = await page
    .locator('[href]')
    .evaluateAll((elements) => elements.map((element) => element.getAttribute('href') ?? ''));
  expect(hrefs.filter((href) => /^\s*(javascript|data|vbscript):/i.test(href))).toEqual([]);
}

test.describe('during the festival', () => {
  test('the day whose doors are open is shown first, with the running session marked «Nå»', async ({
    page,
  }) => {
    await stubSanityWithContent(page);
    // 13:00 UTC is 14:00 or 15:00 in Oslo: inside Saturday's 14:00–17:00 final either way.
    await page.clock.setFixedTime(new Date(`${FESTIVAL_BGM.days[1].date}T13:00:00Z`));
    await page.goto('/board-game-masters');

    const program = page.locator('#program');
    const final = program.locator('article', {
      has: page.getByRole('heading', { name: 'Finale: Catan' }),
    });
    await expect(final).toBeVisible();
    await expect(final.getByText('Nå', { exact: true })).toBeVisible();
  });
});

test.describe('a visitor in another time zone', () => {
  test.use({ timezoneId: 'America/New_York' });

  test('still reads the programme in Oslo time', async ({ page }) => {
    await stubSanityWithContent(page);
    await page.goto('/board-game-masters');
    const program = page.locator('#program');
    // The session card turns the stored wall clock into an instant and back, so this is the
    // text that would shift by six hours if the conversion used the browser's zone.
    await expect(program.getByText('18:00–21:00')).toBeVisible();
  });
});

test('the festival page has no horizontal scroll on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await stubSanityWithContent(page);
  await page.goto('/board-game-masters');
  await expect(page.locator('#program')).toBeVisible();
  // The page content only: the header's own 320px overflow comes from the member portal's login
  // button, which is off in production and on in this suite; tracked in #314.
  const overflow = await page
    .locator('#main')
    .evaluate((main) => main.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
