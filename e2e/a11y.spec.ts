import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { UPCOMING_EVENT, stubSanityWithContent } from './fixtures/sanity';

// An axe scan of the phase 1 pages, in both themes. Serious and critical findings fail the
// build; the rest are attached to the test report for a person to judge.

// Each route with the h1 that proves the real page rendered, not the 404 page in its place.
const ROUTES: [string, string][] = [
  ['/board-game-masters', 'Board Game Masters'],
  [`/arrangementer/${UPCOMING_EVENT.slug.current}`, UPCOMING_EVENT.title],
  ['/kalender', 'Kalender'],
  ['/innlegg/trenger-frivillige', 'Turneringen trenger frivillige'],
];

for (const theme of ['light', 'dark'] as const) {
  for (const [route, heading] of ROUTES) {
    test(`${theme} mode: ${route} has no serious accessibility violations`, async ({
      page,
    }, testInfo) => {
      await stubSanityWithContent(page);
      await page.route('**://*.supabase.co/**', (r) =>
        r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
      );
      await page.addInitScript(
        (preference) => window.localStorage.setItem('theme-preference', preference),
        theme,
      );
      await page.goto(route);
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
      if (theme === 'dark') await expect(page.locator('html')).toHaveClass(/\bdark\b/);

      const { violations } = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      const blocking = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      const rest = violations.filter((v) => !blocking.includes(v));
      if (rest.length > 0) {
        await testInfo.attach('other-axe-findings', {
          body: JSON.stringify(
            rest.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })),
            null,
            2,
          ),
          contentType: 'application/json',
        });
      }
      expect(
        blocking,
        blocking
          .map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)
          .join('\n'),
      ).toEqual([]);
    });
  }
}
