import { expect, test } from '@playwright/test';
import { FESTIVAL_BGM, POSTS, stubSanityWithContent } from './fixtures/sanity';

test.beforeEach(async ({ page }) => {
  await stubSanityWithContent(page);
  await page.route('**://*.supabase.co/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  );
});

test('a post has its own page, reached from the feed', async ({ page }) => {
  const post = POSTS[0];
  await page.goto('/');
  await page
    .getByRole('button', { name: new RegExp(post.title) })
    .first()
    .click();
  await page.getByRole('link', { name: 'Les hele innlegget' }).first().click();

  await expect(page).toHaveURL(new RegExp(`/innlegg/${post.slug.current}$`));
  await expect(page.getByRole('heading', { level: 1, name: post.title })).toBeVisible();
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page).toHaveTitle(`${post.title} · Stavanger Brettspillklubb`);
  await expect(page.getByText(post.subtitle)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Se kalenderen' })).toBeVisible();
});

test('an unknown post is a 404', async ({ page }) => {
  await page.goto('/innlegg/finnes-ikke');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Denne siden mangler i esken');
});

test('a post about the festival links to it, and the festival lists it back', async ({ page }) => {
  const post = POSTS.find((p) => 'relatedEvent' in p)!;
  await page.goto(`/innlegg/${post.slug.current}`);
  await page.getByRole('link', { name: 'Les om Board Game Masters' }).click();
  await expect(page).toHaveURL(new RegExp(`/arrangementer/${FESTIVAL_BGM.slug.current}$`));

  const related = page.getByRole('region', { name: 'Innlegg om arrangementet' });
  await expect(related.getByRole('link', { name: post.title })).toHaveAttribute(
    'href',
    `/innlegg/${post.slug.current}`,
  );
});
