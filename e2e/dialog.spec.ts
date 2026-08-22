import { expect, test } from '@playwright/test';
import { stubSanityEmpty } from './fixtures/sanity';
import { stubSupabase } from './fixtures/supabase';

/**
 * #149: `Dialog` is built on the native `<dialog>` and `showModal()`, and everything that
 * buys — the focus trap, Escape, the top layer, inertness of the page behind — exists only
 * in a real browser. jsdom implements none of it (`src/test/setup.ts` polyfills just enough
 * of the element to mount), so the contract that actually matters is checked here.
 *
 * The board portal is the shortest route to a live dialog. It is behind a Supabase session,
 * which `stubSupabase` seeds — this spec used to carry its own copy of that machinery, and the
 * shared fixture grew out of it when the portal routes got tests of their own.
 */

test.beforeEach(async ({ page }) => {
  await stubSanityEmpty(page);
  await stubSupabase(page);
});

test('the member dialog traps focus, closes on Escape and restores focus', async ({ page }) => {
  await page.goto('/styreportal');

  const opener = page.getByRole('button', { name: 'Legg til medlem' }).first();
  await expect(opener).toBeVisible();
  await opener.click();

  const dialog = page.getByRole('dialog', { name: 'Legg til medlem' });
  await expect(dialog).toBeVisible();

  // `showModal()` moves focus into the dialog rather than leaving it on the opener.
  await expect
    .poll(() => page.evaluate(() => document.activeElement?.closest('dialog') !== null))
    .toBe(true);

  // Tab far past the number of focusable controls in the form. Without a trap this walks
  // out into the page behind, which is what the two hand-rolled overlays used to do.
  //
  // `body` is an allowed landing spot and not a leak: Chromium's tab cycle inside a modal
  // dialog hops through the browser chrome, and headless has none, so the document itself
  // takes focus for one step before the cycle re-enters the dialog. What must never happen
  // is a *focusable element behind the dialog* taking focus.
  for (let i = 0; i < 20; i += 1) {
    await page.keyboard.press('Tab');
    const landing = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body || el === document.documentElement) return 'document';
      return el.closest('dialog') ? 'dialog' : `behind: ${el.tagName}.${el.className}`;
    });
    expect(landing).not.toContain('behind');
  }

  // The page behind is genuinely inert, not just visually covered: a hit test at the
  // opener's own centre lands on the backdrop, never on the button.
  const opensHitTest = await page.evaluate(() => {
    const button = [...document.querySelectorAll('button')].find(
      (b) => b.textContent?.trim().startsWith('Legg til medlem') && !b.closest('dialog'),
    );
    if (!button) return 'no opener found';
    const box = button.getBoundingClientRect();
    const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
    return hit === button ? 'reachable' : 'blocked';
  });
  expect(opensHitTest).toBe('blocked');

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();

  // Focus returns to the button that opened it, which the native element only does while the
  // opener is still in the document — `Dialog` restores it explicitly.
  await expect(opener).toBeFocused();
});

test('the page behind the dialog does not scroll', async ({ page }) => {
  await page.goto('/styreportal');

  await page.getByRole('button', { name: 'Legg til medlem' }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();

  expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).toBe('hidden');

  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).not.toBe('hidden');
});
