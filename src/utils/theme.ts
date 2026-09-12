/**
 * The light/dark preference, and the one place that reads, applies and persists it —
 * `src/utils/motion.ts`'s opposite number.
 */

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme-preference';
const QUERY = '(prefers-color-scheme: dark)';

export function getSystemTheme(): Theme {
  return window.matchMedia?.(QUERY).matches ? 'dark' : 'light';
}

/**
 * Wrapped like `motion.ts`'s equivalent: `localStorage` throws rather than returning null in
 * Safari's private mode, and a preference that cannot be read must degrade to the system
 * setting rather than take the page down.
 */
function getStoredTheme(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'dark' || value === 'light' ? value : null;
  } catch {
    return null;
  }
}

export function storeTheme(theme: Theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* storage unavailable — the class is still applied, it just will not survive a reload */
  }
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

export function getInitialTheme(): Theme {
  return getStoredTheme() ?? getSystemTheme();
}

/** Whether the visitor has made an explicit choice, as opposed to following their OS. */
export function hasStoredTheme(): boolean {
  return getStoredTheme() !== null;
}

/**
 * Subscribe to the OS setting. `ThemeProvider` owns this rather than `initTheme` owning it: a
 * listener that wrote the class directly would leave the provider's state stale, so after an OS
 * change mid-session the toggle would report the wrong theme and its next click would be a
 * visual no-op — rewriting the class to the value it already had, so the visitor had to click
 * twice.
 *
 * Returns its own unsubscribe. Safe in a browser with no `matchMedia`, where it is a no-op.
 */
export function subscribeToSystemTheme(onChange: (theme: Theme) => void) {
  const media = window.matchMedia?.(QUERY);
  if (!media) return () => {};

  const handleChange = (event: MediaQueryListEvent) => onChange(event.matches ? 'dark' : 'light');
  media.addEventListener('change', handleChange);
  return () => media.removeEventListener('change', handleChange);
}

/**
 * Called from `src/main.tsx` before the router is built, next to `initMotion()` — nothing has
 * painted at that point, so the class is in place before any transition could run.
 *
 * Seeding is all it does. Keeping up with the OS afterwards belongs to `ThemeProvider`, which is
 * the thing that also has to stay in step with it; see `subscribeToSystemTheme`.
 */
export function initTheme() {
  applyTheme(getInitialTheme());
}
