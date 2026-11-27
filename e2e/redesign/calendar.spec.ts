import { expect, test } from '@playwright/test';
import { DROP_IN_DATASET, UPCOMING_TOURNAMENT, stubSanityWithContent } from '../fixtures/sanity';
import { stubSupabase } from '../fixtures/supabase';

// The new calendar overview, as the /redesign/ preview builds it (VITE_ENABLE_REDESIGN on).

test.describe('visitor', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**://*.supabase.co/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    );
    await stubSanityWithContent(page);
  });

  test('shows the rhythm, the season board and the special events', async ({ page }) => {
    await page.goto('/kalender');
    await expect(page.getByRole('heading', { name: 'Kalender', level: 1 })).toBeVisible();
    const nights = page.getByRole('region', { name: 'Annenhver torsdag' });
    await expect(nights.getByText('Neste', { exact: true })).toBeVisible();
    await expect(nights.getByRole('link', { name: 'Alle spillkvelder' })).toHaveAttribute(
      'href',
      /\/kalender\/alle\?kategori=spillkveld$/,
    );
    // A date with its own page links to it; one without opens on «Alle arrangementer».
    await expect(nights.locator('a[href$="/arrangementer/spillkveld-torsdag"]')).toBeVisible();
    const board = page.getByRole('region', { name: 'Sesongen på ett brett' });
    await expect(board.getByText('Du er her')).toBeVisible();
    await expect(
      board.getByRole('link', { name: new RegExp(UPCOMING_TOURNAMENT.title) }),
    ).toHaveAttribute('href', /\/kalender\/alle\?arrangement=event-tournament$/);
    const special = page.getByRole('region', { name: 'Spesielle arrangementer' });
    await expect(special.getByRole('heading', { name: UPCOMING_TOURNAMENT.title })).toBeVisible();
    await expect(special.getByRole('link', { name: 'Søk i alle arrangementer' })).toBeVisible();
  });

  test('«Abonner på kalenderen» offers the feed as webcal, Google and a link', async ({ page }) => {
    await page.goto('/kalender');
    await page.getByRole('button', { name: 'Abonner på kalenderen' }).click();
    const dialog = page.getByRole('dialog', { name: 'Abonner på kalenderen' });
    await expect(dialog.getByRole('link', { name: 'Åpne i kalender-appen' })).toHaveAttribute(
      'href',
      /^webcal:\/\/.+\/kalender\.ics$/,
    );
    await expect(dialog.getByRole('link', { name: 'Legg til i Google Kalender' })).toHaveAttribute(
      'href',
      /^https:\/\/calendar\.google\.com\/calendar\/r\?cid=webcal/,
    );
    await dialog.getByRole('button', { name: 'Lukk' }).click();
    await expect(dialog).toBeHidden();
  });

  test('has no horizontal page scroll on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto('/kalender');
    await expect(page.getByRole('region', { name: 'Sesongen på ett brett' })).toBeVisible();
    const overflow = await page
      .locator('main')
      .evaluate((main) => main.scrollWidth - main.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test('a member can sign up for a game night from its date', async ({ page }) => {
  await stubSanityWithContent(page, DROP_IN_DATASET);
  await stubSupabase(page, { isAdmin: false });
  await page.goto('/kalender');
  const nights = page.getByRole('region', { name: 'Annenhver torsdag' });
  await expect(nights.getByRole('button', { name: /^Meld på / }).first()).toBeVisible();
});

test('a member gets no «Bli med» on a night with its own Spond sign-up', async ({ page }) => {
  await stubSanityWithContent(page);
  await stubSupabase(page, { isAdmin: false });
  await page.goto('/kalender');
  const nights = page.getByRole('region', { name: 'Annenhver torsdag' });
  await expect(nights.getByText('Neste', { exact: true })).toBeVisible();
  await expect(nights.getByRole('button', { name: /^Meld på / })).toHaveCount(0);
});
