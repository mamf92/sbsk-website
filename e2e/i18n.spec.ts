import { expect, test } from '@playwright/test';
import { stubSanityEmpty, stubSanityWithContent } from './fixtures/sanity';

// The toggle ships behind VITE_ENABLE_I18N, which the Playwright build turns on. The config's
// browser locale is nb-NO. Only routes that exist in English show the toggle or switch
// <html lang>, and only while they show their real content: /board-game-masters is one of
// them once a festival is published.

test.beforeEach(async ({ page }) => {
  await stubSanityWithContent(page);
  await page.route('**://*.supabase.co/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  );
});

test('a Norwegian browser gets a Norwegian page', async ({ page }) => {
  await page.goto('/board-game-masters');
  await expect(page.locator('html')).toHaveAttribute('lang', 'nb');
});

test.describe('an English browser', () => {
  test.use({ locale: 'en-GB' });

  test('gets English where a page exists in English, and Norwegian elsewhere', async ({ page }) => {
    await page.goto('/board-game-masters');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    await page.goto('/om-oss');
    await expect(page.locator('html')).toHaveAttribute('lang', 'nb');
    await expect(page.getByRole('button', { name: /^NO\b/ })).toHaveCount(0);
  });
});

test('the language choice sets <html lang> and survives a reload', async ({ page }) => {
  await page.goto('/board-game-masters');

  await page.getByRole('button', { name: /^EN\b/ }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');

  await page.getByRole('button', { name: /^NO\b/ }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'nb');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'nb');
});

test('on a 320px phone the toggle moves into the menu instead of widening the bar', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 });
  const barWidth = () =>
    page.locator('header').evaluate((el) => (el.firstElementChild as HTMLElement).scrollWidth);

  await page.goto('/om-oss');
  const without = await barWidth();
  await page.goto('/board-game-masters');
  expect(await barWidth()).toBe(without);

  await page.getByRole('button', { name: /meny/i }).click();
  await page.getByRole('button', { name: /^EN\b/ }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('the Norwegian placeholder and 404 under a translated route stay Norwegian', async ({
  browser,
}) => {
  const context = await browser.newContext({ locale: 'en-GB' });
  const page = await context.newPage();
  await stubSanityEmpty(page);
  await page.route('**://*.supabase.co/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  );

  await page.goto('/board-game-masters');
  await expect(page.getByText('siden om den er under arbeid')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'nb');
  await expect(page.getByRole('button', { name: /^EN\b|^NO\b/ })).toHaveCount(0);

  await page.goto('/arrangementer/finnes-ikke');
  await expect(page.getByRole('heading', { name: 'Denne siden mangler i esken' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'nb');
  await context.close();
});
