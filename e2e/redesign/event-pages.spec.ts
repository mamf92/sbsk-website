import { expect, test } from '@playwright/test';
import { UPCOMING_EVENT, stubSanityWithContent } from '../fixtures/sanity';

// The new event and festival pages, as the /redesign/ preview builds them.

test.beforeEach(async ({ page }) => {
  await page.route('**://*.supabase.co/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  );
  await stubSanityWithContent(page);
});

test('an event page answers when, where, price and sign-up in the hero', async ({ page }) => {
  await page.goto('/arrangementer/spillkveld-torsdag');
  await expect(page.getByRole('heading', { level: 1, name: UPCOMING_EVENT.title })).toBeVisible();
  await expect(page.getByText('Dørene åpner 17:30')).toBeVisible();
  await expect(page.getByText('Byhaugveien 1, 4021 Stavanger')).toBeVisible();
  await expect(page.getByText('Gratis for medlemmer')).toBeVisible();
  await expect(page.getByRole('button', { name: /Meld deg på spillkvelden/ })).toBeVisible();
  const card = page.getByRole('heading', { name: 'Godt å vite' }).locator('..');
  await expect(card.getByText('Inngangen ved parkeringen')).toBeVisible();
  // Every sponsor once, in one row.
  await expect(page.getByRole('region', { name: 'Med støtte fra' })).toHaveCount(1);
});

test('Board Game Masters is a tournament, with the days as the programme switcher', async ({
  page,
}) => {
  await page.goto('/board-game-masters');
  await expect(page.getByText('Turnering · XIX')).toBeVisible();
  await expect(page).toHaveTitle('Board Game Masters · Stavanger Brettspillklubb');
  const program = page.locator('#program');
  await expect(program.getByRole('heading', { name: 'Innledende runder: Catan' })).toBeVisible();
  const days = program.getByRole('group', { name: 'Velg dag' });
  await days.getByRole('button').nth(1).click();
  await expect(page).toHaveURL(/\?dag=2/);
  await expect(program.getByRole('heading', { name: 'Finale: Catan' })).toBeVisible();
  await expect(program.getByRole('heading', { name: 'Innledende runder: Catan' })).toHaveCount(0);
});

for (const path of ['/arrangementer/spillkveld-torsdag', '/board-game-masters']) {
  test(`${path} has no horizontal page scroll on a phone`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto(path);
    await expect(page.locator('h1')).toBeVisible();
    const overflow = await page
      .locator('main')
      .evaluate((main) => main.scrollWidth - main.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}
