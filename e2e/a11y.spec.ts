import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { UPCOMING_EVENT, stubSanityWithContent } from './fixtures/sanity';

// An axe scan of the phase 1 pages, in both themes. Serious and critical findings fail the
// build; the rest are reported in the test output for a person to judge.

const ROUTES = [
  '/board-game-masters',
  `/arrangementer/${UPCOMING_EVENT.slug.current}`,
  '/kalender',
  '/innlegg/trenger-frivillige',
];

for (const theme of ['light', 'dark'] as const) {
  for (const route of ROUTES) {
    test(`${theme} mode: ${route} has no serious accessibility violations`, async ({ page }) => {
      await stubSanityWithContent(page);
      await page.route('**://*.supabase.co/**', (r) =>
        r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
      );
      await page.addInitScript(
        (preference) => window.localStorage.setItem('theme-preference', preference),
        theme,
      );
      await page.goto(route);
      await expect(page.locator('h1')).toBeVisible();

      const { violations } = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      const blocking = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(
        blocking,
        blocking
          .map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)
          .join('\n'),
      ).toEqual([]);
    });
  }
}
