import { describe, expect, it, vi } from 'vitest';
import { getInitialTheme, initTheme, toggleTheme } from './theme';

const STORAGE_KEY = 'theme-preference';

function mockSystemTheme(dark: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: dark,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

describe('getInitialTheme', () => {
  it('prefers a stored preference over the system setting', () => {
    localStorage.setItem(STORAGE_KEY, 'light');
    mockSystemTheme(true);
    expect(getInitialTheme()).toBe('light');
  });

  it('falls back to the system setting when nothing is stored', () => {
    mockSystemTheme(true);
    expect(getInitialTheme()).toBe('dark');
  });

  it('ignores a corrupted stored value', () => {
    localStorage.setItem(STORAGE_KEY, 'banana');
    mockSystemTheme(false);
    expect(getInitialTheme()).toBe('light');
  });
});

describe('initTheme', () => {
  it('applies the dark class when the stored preference is dark', () => {
    localStorage.setItem(STORAGE_KEY, 'dark');
    initTheme();
    expect(document.documentElement).toHaveClass('dark');
  });

  it('leaves the dark class off for a light preference', () => {
    localStorage.setItem(STORAGE_KEY, 'light');
    mockSystemTheme(true);
    initTheme();
    expect(document.documentElement).not.toHaveClass('dark');
  });
});

describe('toggleTheme', () => {
  it('switches light to dark and persists the choice', () => {
    localStorage.setItem(STORAGE_KEY, 'light');
    initTheme();

    expect(toggleTheme()).toBe('dark');
    expect(document.documentElement).toHaveClass('dark');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('dark');
  });

  it('switches dark back to light', () => {
    localStorage.setItem(STORAGE_KEY, 'dark');
    initTheme();

    expect(toggleTheme()).toBe('light');
    expect(document.documentElement).not.toHaveClass('dark');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('light');
  });

  it('round-trips back to the starting theme', () => {
    localStorage.setItem(STORAGE_KEY, 'light');
    initTheme();

    toggleTheme();
    expect(toggleTheme()).toBe('light');
    expect(document.documentElement).not.toHaveClass('dark');
  });
});
