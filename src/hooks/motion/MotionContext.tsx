import { createContext, useContext } from 'react';
import type { MotionPreference } from '../../utils/motion';

export interface MotionContextType {
  motion: MotionPreference;
  /** `true` when the OS asks for reduced motion. */
  reduced: boolean;
}

export const MotionContext = createContext<MotionContextType | undefined>(undefined);

export function useMotion(): MotionContextType {
  const context = useContext(MotionContext);

  if (!context) {
    throw new Error('useMotion must be used within a MotionProvider');
  }
  return context;
}
