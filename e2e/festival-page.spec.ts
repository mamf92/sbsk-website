import { expect, test } from '@playwright/test';
import { FESTIVAL_BGM, stubSanityWithContent } from './fixtures/sanity';

test.beforeEach(async ({ page }) => {
  await stubSanityWithContent(page);
  await page.route('**://*.supabase.co/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  );
});

test('/board-game-masters shows the current edition with its programme', async ({ page }) => {
  await page.goto('/board-game-masters');
  await expect(page.getByRole('heading', { level: 1, name: 'Board Game Masters' })).toBeVisible();
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page).toHaveTitle('Board Game Masters · Stavanger Brettspillklubb');
  await expect(page.getByText('XIX')).toBeVisible();

  const program = page.locator('#program');
  await expect(program.getByRole('heading', { level: 2, name: 'Program' })).toBeVisible();
  await expect(program.getByRole('heading', { level: 3, name: '18:00' })).toBeVisible();
  await expect(program.getByRole('heading', { name: 'Innledende runder: Catan' })).toBeVisible();
  await expect(program.getByRole('status')).toHaveText('Viser 3 av 3 programposter');
});

test('the format filter narrows the day, counts, and resets', async ({ page }) => {
  await page.goto('/board-game-masters');
  const program = page.locator('#program');
  const filter = program.getByRole('group', { name: 'Vis formater' });

  await filter.getByRole('button', { name: 'Turnering' }).click();
  await expect(filter.getByRole('button', { name: 'Turnering' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(program.getByRole('status')).toHaveText('Viser 1 av 3 programposter');
  await expect(program.getByRole('heading', { name: 'Lær å spille Azul' })).toHaveCount(0);

  await filter.getByRole('button', { name: 'Nullstill' }).click();
  await expect(program.getByRole('status')).toHaveText('Viser 3 av 3 programposter');
});

test('the day switcher is kept in ?dag=N, and an empty day says so', async ({ page }) => {
  await page.goto('/board-game-masters');
  const days = page.locator('#program').getByRole('group', { name: 'Velg dag' });

  await days.getByRole('button').nth(1).click();
  await expect(page).toHaveURL(/\?dag=2$/);
  await expect(page.getByRole('heading', { name: 'Finale: Catan' })).toBeVisible();

  await page.goto('/board-game-masters?dag=3');
  await expect(
    page.locator('#program').getByText('Programmet for denne dagen kommer snart'),
  ).toBeVisible();
});

test('a festival also has its page under /arrangementer', async ({ page }) => {
  await page.goto(`/arrangementer/${FESTIVAL_BGM.slug.current}`);
  await expect(page.getByRole('heading', { level: 1, name: 'Board Game Masters' })).toBeVisible();
  const link = page.getByRole('link', { name: 'Se programmet', exact: true });
  await expect(link).toHaveAttribute('href', /#program$/);
  await link.click();
  await expect(page).toHaveURL(/#program$/);
  await expect(page.locator('#program')).toBeInViewport();
});

test('FAQ answers open from their question', async ({ page }) => {
  await page.goto('/board-game-masters');
  const answer = page.getByText('Nei, vi har egne økter for å lære.');
  await expect(answer).toBeHidden();
  await page.getByText('Må jeg kunne spillene fra før?').click();
  await expect(answer).toBeVisible();
});

test('the programme can be downloaded as one calendar file', async ({ page }) => {
  await page.goto('/board-game-masters');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Legg programmet i kalenderen' }).click(),
  ]);
  expect(download.suggestedFilename()).toBe(`${FESTIVAL_BGM.slug.current}.ics`);
  const text = await (await download.createReadStream()).toArray();
  const ics = Buffer.concat(text).toString('utf8');
  expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(5);
  expect(ics).toContain('UID:festival-bgm-fre-s-catan@sbsk.no');
});

test('printing shows every day as compact rows and hides the controls', async ({ page }) => {
  await page.goto('/board-game-masters');
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('header')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Legg programmet i kalenderen' })).toBeHidden();
  await expect(
    page.getByText(/^18:00–21:00 · Innledende runder: Catan · Turnering · Sal A$/),
  ).toBeVisible();
  await expect(page.getByText(/^14:00–17:00 · Finale: Catan · Finale$/)).toBeVisible();
});

test('in English the chrome is translated and the programme follows', async ({ page }) => {
  await page.goto('/board-game-masters');
  await page.getByRole('button', { name: /^EN\b/ }).click();
  await expect(page.getByRole('heading', { level: 2, name: 'Programme' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Qualifiers: Catan' })).toBeVisible();
  // No English title: the Norwegian one is shown and marked as Norwegian.
  await expect(page.getByRole('heading', { name: 'Lær å spille Azul' })).toHaveAttribute(
    'lang',
    'nb',
  );
});

test('each festival day is a calendar row that opens that day of the programme', async ({
  page,
}) => {
  await page.goto('/kalender');
  const link = page.getByRole('link', { name: 'Les mer om Board Game Masters – Åpningskveld' });
  await expect(link).toHaveAttribute('href', /\/arrangementer\/board-game-masters-test\?dag=1$/);

  await page
    .getByRole('link', {
      name: /^Les mer om Board Game Masters – (søndag|mandag|tirsdag|onsdag|torsdag|fredag|lørdag)/,
    })
    .first()
    .click();
  await expect(page).toHaveURL(/\?dag=2$/);
  await expect(page.getByRole('heading', { name: 'Finale: Catan' })).toBeVisible();
});

test('the home page points to a festival that starts within two months', async ({ page }) => {
  await page.goto('/');
  const teaser = page.locator('section', {
    has: page.getByRole('heading', { level: 2, name: 'Board Game Masters' }),
  });
  await expect(teaser.getByText('XIX')).toBeVisible();
  await teaser.getByRole('link', { name: 'Se programmet' }).click();
  await expect(page).toHaveURL(/\/arrangementer\/board-game-masters-test#program$/);
});

test("a one-day festival still shows its day, with the day's own sign-up", async ({ page }) => {
  const oneDay = {
    ...FESTIVAL_BGM,
    signup: undefined,
    days: [
      {
        ...FESTIVAL_BGM.days[0],
        signup: {
          method: 'lenke',
          url: 'https://example.test/dag1',
          label: { nb: 'Meld deg på dagen' },
        },
      },
    ],
  };
  await stubSanityWithContent(page, [oneDay]);
  await page.goto('/board-game-masters');
  await expect(page.getByRole('heading', { level: 2, name: 'Dagene' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Meld deg på dagen' })).toBeVisible();
});

test('an announced festival with only its dates says the programme is coming', async ({ page }) => {
  const announced = {
    ...FESTIVAL_BGM,
    signup: undefined,
    venue: undefined,
    faq: undefined,
    days: FESTIVAL_BGM.days.map(({ _key, date }) => ({ _key, date })),
  };
  await stubSanityWithContent(page, [announced]);
  await page.goto('/board-game-masters');
  await expect(page.getByRole('heading', { level: 1, name: 'Board Game Masters' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Dagene' })).toBeVisible();
  await expect(
    page.locator('#program').getByText('Programmet for denne dagen kommer snart'),
  ).toBeVisible();
  // Nothing to download or print yet.
  await expect(page.getByRole('button', { name: 'Legg programmet i kalenderen' })).toHaveCount(0);
});
