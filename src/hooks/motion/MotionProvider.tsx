import { useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { MotionContext } from './MotionContext';
import type { MotionContextType } from './MotionContext';
import { applyMotion, getInitialMotion, storeMotion } from '../../utils/motion';
import type { MotionPreference } from '../../utils/motion';

/**
 * Mounted in `src/main.tsx` around `RouterProvider` rather than inside `App`, unlike
 * `ThemeProvider`. The shell's own `errorElement` renders *instead of* `<App />`, and the error
 * page renders a `DiceLogo` — which reads this preference — so a provider inside `App` would
 * make `useMotion()` throw on exactly the screen that has the least margin for a second failure.
 *
 * `initMotion()` in `main.tsx` has already put the class on `<html>` before this mounts, so
 * there is no apply-on-mount effect here: the only writes are the ones a visitor asks for.
 * That is also what keeps "follow the system" alive — see `initMotion`'s own comment.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  const [motion, setMotionState] = useState<MotionPreference>(() => getInitialMotion());

  const setMotion = useCallback((next: MotionPreference) => {
    setMotionState(next);
    applyMotion(next);
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
