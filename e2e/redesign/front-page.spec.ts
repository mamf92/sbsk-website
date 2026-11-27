import { expect, test } from '@playwright/test';
import { POSTS, UPCOMING_TOURNAMENT, stubSanityWithContent } from '../fixtures/sanity';

// The new front page, as the /redesign/ preview builds it (VITE_ENABLE_REDESIGN on).

test.beforeEach(async ({ page }) => {
  await page.route('**://*.supabase.co/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  );
  await stubSanityWithContent(page);
});

test('the next game night is the hero', async ({ page }) => {
  await page.goto('/');
  const hero = page.getByRole('region', { name: 'Neste spillkveld' });
  await expect(hero).toBeVisible();
  await expect(hero.getByRole('button', { name: /Legg i kalenderen/ })).toBeVisible();
  await expect(hero.getByRole('link', { name: 'Vis i kart' })).toBeVisible();
});

test('«Legg i kalenderen» downloads an .ics file', async ({ page }) => {
  await page.goto('/');
  const download = page.waitForEvent('download');
  await page
    .getByRole('region', { name: 'Neste spillkveld' })
    .getByRole('button', { name: /Legg i kalenderen/ })
    .click();
  expect((await download).suggestedFilename()).toMatch(/\.ics$/);
});

test('the notice board links to the posts, and «Alle innlegg» has a page', async ({ page }) => {
  await page.goto('/');
  const board = page.getByRole('region', { name: 'Oppslagstavla' });
  await expect(board.getByRole('link', { name: new RegExp(POSTS[0].title) })).toBeVisible();
  await board.getByRole('link', { name: 'Alle innlegg' }).click();
  await expect(page).toHaveURL(/\/innlegg$/);
  await expect(page.getByRole('heading', { name: 'Innlegg', level: 1 })).toBeAttached();
});

test('special events get a poster', async ({ page }) => {
  await page.goto('/');
  const highlights = page.getByRole('region', { name: 'Kommende høydepunkter' });
  await expect(highlights.getByRole('heading', { name: UPCOMING_TOURNAMENT.title })).toBeVisible();
});

test('the page has one main landmark and no horizontal scroll on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Neste spillkveld' })).toBeVisible();
  await expect(page.locator('main')).toHaveCount(1);
  // Measured on <main>: the shared header is checked by its own specs.
  const overflow = await page
    .locator('main')
    .evaluate((main) =>
      Math.max(
        0,
        ...[...main.querySelectorAll('*')].map(
          (el) => el.getBoundingClientRect().right - document.documentElement.clientWidth,
        ),
      ),
    );
  expect(overflow).toBeLessThanOrEqual(1);
});
