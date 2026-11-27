import { expect, test } from '@playwright/test';
import { DROP_IN_DATASET, UPCOMING_TOURNAMENT, stubSanityWithContent } from '../fixtures/sanity';
import { PROFILES, stubSupabase } from '../fixtures/supabase';

// The new front page for a signed-in member (VITE_ENABLE_REDESIGN on).

test('a member sees their greeting, card, badges and sign-up', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await stubSanityWithContent(page, DROP_IN_DATASET);
  await stubSupabase(page, { isAdmin: false });

  await page.goto('/');

  const hero = page.getByRole('region', { name: 'Din neste spillkveld' });
  await expect(hero.getByText(`Hei, ${PROFILES[0].name}!`)).toBeVisible();
  await expect(hero.getByRole('button', { name: /^Meld på / })).toBeVisible();

  const corner = page.getByRole('region', { name: 'Ditt medlemskap' });
  await expect(corner.getByRole('link', { name: 'Min side' })).toBeVisible();
  await expect(corner.getByText('Første kast')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Tre trekk, så er du i gang' })).toHaveCount(0);

  const highlights = page.getByRole('region', { name: 'Kommende høydepunkter' });
  await expect(
    highlights.getByRole('button', { name: `Meld på ${UPCOMING_TOURNAMENT.title}` }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
