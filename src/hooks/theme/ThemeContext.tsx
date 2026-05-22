import { createContext, useContext } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  isDarkMode: boolean;
  setTheme: (theme: Theme) => void;
  toggleDarkMode: () => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
