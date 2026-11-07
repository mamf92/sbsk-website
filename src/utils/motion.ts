/**
 * The reduced-motion setting, and the one place that reads and applies it. Since the 2026
 * redesign (decision 3) it follows the OS and nothing else: there is no on-site switch and
 * nothing is stored.
 *
 * `src/index.css` decides what reduced motion *means* (the `motion-reduce` variant and the
 * three `lift-*` utilities); this file decides *when* it applies. The condition there is the
 * `.reduce-motion` class on `<html>`, which this file keeps in step with
 * `prefers-reduced-motion`.
 */

export type MotionPreference = 'full' | 'reduced';

const REDUCE_MOTION_CLASS = 'reduce-motion';
const QUERY = '(prefers-reduced-motion: reduce)';

export function getSystemMotion(): MotionPreference {
  return window.matchMedia?.(QUERY).matches ? 'reduced' : 'full';
}

/**
 * The preference as the DOM already holds it, for code that needs the answer at the moment
 * something happens rather than on every render.
 *
 * This is what `DiceLogo` reads. Primitives under `src/components/ui/` are deliberately
 * context-free — `Button`, `Card` and `Chip` all are, and only layout components consume
 * context — and the die in particular renders on the shell error screen, where depending on a
 * provider would mean one failure could take out the page that exists to report failures.
 * Reading the class is exact: `applyMotion` is the only thing that writes it.
 */
export function motionIsReduced(): boolean {
  return document.documentElement.classList.contains(REDUCE_MOTION_CLASS);
}

export function applyMotion(preference: MotionPreference) {
  document.documentElement.classList.toggle(REDUCE_MOTION_CLASS, preference === 'reduced');
}

export function getInitialMotion(): MotionPreference {
  return getSystemMotion();
}

/**
 * Subscribe to the OS setting. `MotionProvider` owns this, so its state and the class on
 * `<html>` move together.
 *
 * Returns its own unsubscribe. Safe in a browser with no `matchMedia`, where it is a no-op.
 */
export function subscribeToSystemMotion(onChange: (preference: MotionPreference) => void) {
  const media = window.matchMedia?.(QUERY);
  if (!media) return () => {};

  const handleChange = (event: MediaQueryListEvent) => onChange(event.matches ? 'reduced' : 'full');
  media.addEventListener('change', handleChange);
  return () => media.removeEventListener('change', handleChange);
}

/**
 * Called from `src/main.tsx` before the router is built, next to `initTheme()` — nothing has
 * painted at that point, so the class is in place before any transition could run.
 *
 * Seeding is all it does. Keeping up with the OS afterwards belongs to `MotionProvider`.
 */
export function initMotion() {
  applyMotion(getInitialMotion());
}
