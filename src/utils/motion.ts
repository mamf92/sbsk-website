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

/**
 * Called from `src/main.tsx` before the router is built, next to `initTheme()` — nothing has
 * painted at that point, so the class is in place before any transition could run.
 *
 * The subscription is the part `theme.ts` has no equivalent of, and it is deliberate on two
 * counts. Storage is written *only* by an explicit toggle, so "follow the system" survives as a
 * real state rather than being frozen into storage on first load the way `ThemeProvider` freezes
 * the theme; and while it survives, a visitor who turns reduced motion on in their OS mid-session
 * gets it here without a reload. Once they have chosen for themselves, their choice stands and
 * the listener stops deciding anything.
 *
 * Returns its own unsubscribe so a caller can own the listener's lifetime; at module scope in
 * `main.tsx` it is simply never called, which is correct — the subscription lives as long as the
 * document does.
 */
export function initMotion(): () => void {
  applyMotion(getInitialMotion());

  const media = window.matchMedia?.(QUERY);
  if (!media) return () => {};

  const handleChange = (event: MediaQueryListEvent) => {
    if (getStoredMotion()) return;
    applyMotion(event.matches ? 'reduced' : 'full');
  };
  media.addEventListener('change', handleChange);
  return () => media.removeEventListener('change', handleChange);
}
