/**
 * The reduced-motion preference, and the one place that reads, applies and persists it —
 * `src/utils/theme.ts`'s opposite number.
 *
 * `src/index.css` decides what reduced motion *means* (the `motion-reduce` variant and the
 * three `lift-*` utilities); this file decides *when* it applies. The condition there is the
 * `.reduce-motion` class on `<html>`, not `prefers-reduced-motion`, so that an explicit choice
 * can win in both directions — see the comment above the variant for why dropping the media
 * query is safe in a client-rendered SPA.
 */

export type MotionPreference = 'full' | 'reduced';

const STORAGE_KEY = 'motion-preference';
const REDUCE_MOTION_CLASS = 'reduce-motion';
const QUERY = '(prefers-reduced-motion: reduce)';

export function getSystemMotion(): MotionPreference {
  return window.matchMedia?.(QUERY).matches ? 'reduced' : 'full';
}

/**
 * Unlike `theme.ts`'s equivalent, this is wrapped: `localStorage` *throws* rather than
 * returning null in Safari's private mode, and a preference that cannot be read must degrade
 * to the system setting rather than take the page down. `DiceLogo` already guards its own
 * reads this way.
 */
function getStoredMotion(): MotionPreference | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'reduced' || value === 'full' ? value : null;
  } catch {
    return null;
  }
}

export function storeMotion(preference: MotionPreference) {
  try {
    localStorage.setItem(STORAGE_KEY, preference);
  } catch {
    /* storage unavailable — the class is still applied, it just will not survive a reload */
  }
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
  return getStoredMotion() ?? getSystemMotion();
}

/** Whether the visitor has made an explicit choice, as opposed to following their OS. */
export function hasStoredMotion(): boolean {
  return getStoredMotion() !== null;
}

/**
 * Subscribe to the OS setting. `MotionProvider` owns this rather than `initMotion` owning it:
 * a listener that wrote the class directly would leave the provider's state stale, so after an
 * OS change mid-session the toggle would report the wrong `aria-pressed` and its next click
 * would be a visual no-op — rewriting the class to the value it already had, so the visitor had
 * to click twice.
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
 * Seeding is all it does. Keeping up with the OS afterwards belongs to `MotionProvider`, which
 * is the thing that also has to stay in step with it; see `subscribeToSystemMotion`.
 */
export function initMotion() {
  applyMotion(getInitialMotion());
}
