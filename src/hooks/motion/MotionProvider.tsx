import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { MotionContext } from './MotionContext';
import type { MotionContextType } from './MotionContext';
import {
  applyMotion,
  getInitialMotion,
  hasStoredMotion,
  storeMotion,
  subscribeToSystemMotion,
} from '../../utils/motion';
import type { MotionPreference } from '../../utils/motion';

/**
 * Mounted in `src/main.tsx` around `RouterProvider` rather than inside `App`, unlike
 * `ThemeProvider`. The shell's own `errorElement` renders *instead of* `<App />`, and the error
 * page renders a `DiceLogo` — which reads this preference — so a provider inside `App` would
 * make `useMotion()` throw on exactly the screen that has the least margin for a second failure.
 *
 * `initMotion()` in `main.tsx` seeds the class before anything paints; from mount onwards this
 * provider owns it, including keeping up with the OS. Both halves have to live in one place: a
 * subscription that wrote the class without telling React would leave the toggle reporting a
 * state the page no longer has.
 *
 * Storage is still only written by an explicit choice, which is what keeps "follow the system"
 * alive as a real state rather than freezing it on first load.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  const [motion, setMotionState] = useState<MotionPreference>(() => getInitialMotion());

  // One writer for the class, so state and page can never disagree.
  useEffect(() => applyMotion(motion), [motion]);

  // Until the visitor chooses for themselves, the OS keeps deciding — mid-session included.
  useEffect(
    () => subscribeToSystemMotion((preference) => hasStoredMotion() || setMotionState(preference)),
    [],
  );

  const setMotion = useCallback((next: MotionPreference) => {
    setMotionState(next);
    storeMotion(next);
  }, []);

  const toggleReducedMotion = useCallback(
    () => setMotion(motion === 'reduced' ? 'full' : 'reduced'),
    [motion, setMotion],
  );

  const value = useMemo<MotionContextType>(
    () => ({
      motion,
      reduced: motion === 'reduced',
      setMotion,
      toggleReducedMotion,
    }),
    [motion, setMotion, toggleReducedMotion],
  );

  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>;
}
