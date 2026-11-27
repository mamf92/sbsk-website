import { expect, test } from '@playwright/test';
import { PAST_EVENT, UPCOMING_TOURNAMENT, stubSanityWithContent } from '../fixtures/sanity';

// «Alle arrangementer» (/kalender/alle), as the /redesign/ preview builds it.

test.beforeEach(async ({ page }) => {
  await page.route('**://*.supabase.co/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  );
  await stubSanityWithContent(page);
});

test('search spans past and future, and lives in the URL', async ({ page }) => {
  await page.goto('/kalender/alle');
  await page.getByRole('searchbox', { name: 'Søk i alle arrangementer' }).fill('spillkveld');
  await expect(page).toHaveURL(/q=spillkveld/);
  await expect(page.getByRole('region', { name: 'Kommende' })).toBeVisible();
  await expect(
    page
      .getByRole('region', { name: 'Tidligere' })
      .getByRole('heading', { name: PAST_EVENT.title }),
  ).toBeVisible();
  await page.getByRole('button', { name: /Nullstill/ }).click();
  await expect(page).not.toHaveURL(/q=/);
});

test('a category chip filters the list', async ({ page }) => {
  await page.goto('/kalender/alle?kategori=turnering');
  await expect(page.getByRole('button', { name: 'Turnering', pressed: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: UPCOMING_TOURNAMENT.title })).toBeVisible();
  await expect(page.getByText(/^1 treff/)).toBeVisible();
});

test('past events open behind a button', async ({ page }) => {
  await page.goto('/kalender/alle');
  await expect(page.getByRole('heading', { name: PAST_EVENT.title })).toHaveCount(0);
  await page.getByRole('button', { name: 'Vis tidligere arrangementer' }).click();
  await expect(page).toHaveURL(/tidligere=vis/);
  await expect(page.getByRole('heading', { name: PAST_EVENT.title })).toBeVisible();
});

test('the month view picks a day and keeps it in the URL', async ({ page }) => {
  const start = new Date(UPCOMING_TOURNAMENT.eventStartTime);
  const key = start.toLocaleDateString('sv-SE', { timeZone: 'Europe/Oslo' });
  await page.goto(`/kalender/alle?visning=maned&maned=${key.slice(0, 7)}`);
  await page.getByRole('button', { name: new RegExp(`: ${UPCOMING_TOURNAMENT.title}$`) }).click();
  await expect(page).toHaveURL(new RegExp(`dag=${key}`));
  await page.getByRole('button', { name: 'Neste måned' }).click();
  await expect(page).not.toHaveURL(/dag=/);
});

test('has no horizontal page scroll on a phone, in either view', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  for (const url of ['/kalender/alle', '/kalender/alle?visning=maned']) {
    await page.goto(url);
    await expect(page.getByRole('heading', { name: 'Alle arrangementer' })).toBeVisible();
    const overflow = await page
      .locator('main')
      .evaluate((main) => main.scrollWidth - main.clientWidth);
    expect(overflow, url).toBeLessThanOrEqual(0);
  }
});

test('typing in search does not refetch the calendar', async ({ page }) => {
  await page.goto('/kalender/alle');
  await expect(page.getByRole('heading', { name: 'Alle arrangementer' })).toBeVisible();
  let fetches = 0;
  page.on('request', (request) => {
    if (new URL(request.url()).hostname.endsWith('.api.sanity.io')) fetches += 1;
  });
  await page
    .getByRole('searchbox', { name: 'Søk i alle arrangementer' })
    .pressSequentially('turnering');
  await expect(page).toHaveURL(/q=turnering/);
  await expect(page.getByRole('searchbox', { name: 'Søk i alle arrangementer' })).toHaveValue(
    'turnering',
  );
  expect(fetches).toBe(0);
});
