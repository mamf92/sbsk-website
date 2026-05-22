import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { ThemeContext } from './ThemeContext';
import { getInitialTheme } from '../utils/theme';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  isDarkMode: boolean;
  setTheme: (theme: Theme) => void;
  toggleDarkMode: () => void;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme());
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme-preference', theme);
  }, [theme]);

  const toggleDarkMode = () => {
    setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  const value: ThemeContextType = {
    theme,
    isDarkMode: theme === 'dark',
    setTheme,
    toggleDarkMode,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
