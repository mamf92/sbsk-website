import { expect, test } from '@playwright/test';
import { UPCOMING_EVENT, stubSanityWithContent } from './fixtures/sanity';

const path = `/arrangementer/${UPCOMING_EVENT.slug.current}`;

test.beforeEach(async ({ page }) => {
  await stubSanityWithContent(page);
  await page.route('**://*.supabase.co/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  );
});

test('an event page shows its facts, venue with a map link, and sponsors', async ({ page }) => {
  await page.goto(path);
  await expect(page.getByRole('heading', { level: 1, name: UPCOMING_EVENT.title })).toBeVisible();

  const facts = page.locator('dl').first();
  await expect(facts.getByRole('term')).toHaveText(['Når', 'Hvor', 'Pris', 'Påmelding']);
  await expect(facts).toContainText('Byhaugkafeen');
  await expect(facts).toContainText('Gratis for medlemmer');

  await expect(page.getByRole('heading', { name: 'Oppmøte' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Vis i kart/ })).toHaveAttribute(
    'href',
    /^https:\/\/www\.openstreetmap\.org\/search\?query=/,
  );

  await expect(page.getByText('Med støtte fra')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Partnere', exact: true })).toBeVisible();
});

test('signing up opens Spond in a new tab with no opener', async ({ page, context }) => {
  await context.route('https://spond.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: '<p>Spond</p>' }),
  );
  await page.goto(path);
  const button = page.getByRole('button', { name: 'Meld deg på spillkvelden' });
  await expect(button).toBeVisible();

  const [popup] = await Promise.all([context.waitForEvent('page'), button.click()]);
  await popup.waitForLoadState();
  expect(popup.url()).toContain('spond.com/landing/event/test');
  expect(await popup.evaluate(() => window.opener)).toBeNull();
});

test('in English the page chrome is translated and Norwegian content is marked', async ({
  page,
}) => {
  await page.goto(path);
  await page.getByRole('button', { name: /^EN\b/ }).click();

  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { name: 'Getting there' })).toBeVisible();
  await expect(page.locator('dl').first().getByRole('term').first()).toHaveText('When');
  await expect(page.getByRole('heading', { level: 1 })).toHaveAttribute('lang', 'nb');
  await expect(page.getByRole('button', { name: 'Meld deg på spillkvelden' })).toHaveAttribute(
    'lang',
    'nb',
  );
});

test('an event page has no horizontal scroll on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto(path);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
