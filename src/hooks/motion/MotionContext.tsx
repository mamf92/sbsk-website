import { createContext, useContext } from 'react';
import type { MotionPreference } from '../../utils/motion';

export interface MotionContextType {
  motion: MotionPreference;
  /** `true` when motion is reduced, whether by the visitor's choice or by their OS. */
  reduced: boolean;
  setMotion: (motion: MotionPreference) => void;
  toggleReducedMotion: () => void;
}

export const MotionContext = createContext<MotionContextType | undefined>(undefined);

export function useMotion(): MotionContextType {
  const context = useContext(MotionContext);

  if (!context) {
    throw new Error('useMotion must be used within a MotionProvider');
  }
  return context;
}
