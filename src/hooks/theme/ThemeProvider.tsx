import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ThemeContext } from './ThemeContext';
import type { ThemeContextType } from './ThemeContext';
import {
  applyTheme,
  getInitialTheme,
  hasStoredTheme,
  storeTheme,
  subscribeToSystemTheme,
} from '../../utils/theme';
import type { Theme } from '../../utils/theme';

/**
 * Mounted in `src/main.tsx` around `RouterProvider`, like `MotionProvider` and for the same
 * reason: the shell's own `errorElement` renders *instead of* `<App />`, and `Header` — the only
 * consumer of this context — could in principle end up on that screen too, so a provider inside
 * `App` would make `useTheme()` throw exactly where there is the least margin for a second
 * failure.
 *
 * `initTheme()` in `main.tsx` seeds the class before anything paints; from mount onwards this
 * provider owns it, including keeping up with the OS. Both halves have to live in one place: a
 * subscription that wrote the class without telling React would leave the toggle reporting a
 * state the page no longer has.
 *
 * Storage is still only written by an explicit choice, which is what keeps "follow the system"
 * alive as a real state rather than freezing it on first load.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => getInitialTheme());

  // One writer for the class, so state and page can never disagree.
  useEffect(() => applyTheme(theme), [theme]);

  // Until the visitor chooses for themselves, the OS keeps deciding — mid-session included.
  useEffect(() => subscribeToSystemTheme((next) => hasStoredTheme() || setThemeState(next)), []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    storeTheme(next);
  }, []);

  const toggleDarkMode = useCallback(
    () => setTheme(theme === 'dark' ? 'light' : 'dark'),
    [theme, setTheme],
  );

  const value = useMemo<ThemeContextType>(
    () => ({
      theme,
      isDarkMode: theme === 'dark',
      setTheme,
      toggleDarkMode,
    }),
    [theme, setTheme, toggleDarkMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
