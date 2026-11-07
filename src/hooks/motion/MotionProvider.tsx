import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { MotionContext } from './MotionContext';
import type { MotionContextType } from './MotionContext';
import { applyMotion, getInitialMotion, subscribeToSystemMotion } from '../../utils/motion';
import type { MotionPreference } from '../../utils/motion';

/**
 * Mounted in `src/main.tsx` around `RouterProvider`, like `ThemeProvider`, so the error page's
 * `DiceLogo` can still read it (#248).
 *
 * Reduced motion follows the OS (decision 3). `initMotion()` seeds the class before anything
 * paints; from mount onwards this provider keeps it in step with the OS, mid-session included.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  const [motion, setMotion] = useState<MotionPreference>(() => getInitialMotion());

  // One writer for the class, so state and page can never disagree.
  useEffect(() => applyMotion(motion), [motion]);
  useEffect(() => subscribeToSystemMotion(setMotion), []);

  const value = useMemo<MotionContextType>(
    () => ({ motion, reduced: motion === 'reduced' }),
    [motion],
  );

  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>;
}
