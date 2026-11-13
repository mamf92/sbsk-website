import { expect, test } from '@playwright/test';
import { stubSanityEmpty } from './fixtures/sanity';

// The toggle ships behind VITE_ENABLE_I18N, which the Playwright build turns on. The config's
// browser locale is nb-NO.

test.beforeEach(async ({ page }) => {
  await stubSanityEmpty(page);
  await page.route('**://*.supabase.co/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  );
});

test('a Norwegian browser gets a Norwegian page', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'nb');
});

test.describe('an English browser', () => {
  test.use({ locale: 'en-GB' });

  test('gets an English page on its first visit', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });
});

test('the language choice sets <html lang> and survives a reload', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: /^EN\b/ }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');

  await page.getByRole('button', { name: /^NO\b/ }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'nb');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'nb');
});
