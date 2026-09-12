import { describe, expect, it, vi } from 'vitest';
import {
  applyTheme,
  getInitialTheme,
  getSystemTheme,
  hasStoredTheme,
  initTheme,
  storeTheme,
  subscribeToSystemTheme,
} from './theme';

const STORAGE_KEY = 'theme-preference';

type Listener = (event: MediaQueryListEvent) => void;

/**
 * The same shape as `motion.test.ts`'s helper, plus a handle on the `change` listener — the
 * subscription is the behaviour that separates this module from the version #247 replaced.
 */
function mockSystemTheme(dark: boolean) {
  const listeners: Listener[] = [];
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: dark,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn((_: string, listener: Listener) => listeners.push(listener)),
    removeEventListener: vi.fn((_: string, listener: Listener) => {
      const at = listeners.indexOf(listener);
      if (at >= 0) listeners.splice(at, 1);
    }),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;

  return {
    /** Pretend the OS setting changed while the page was open. */
    emit: (matches: boolean) =>
      listeners.forEach((listener) => listener({ matches } as MediaQueryListEvent)),
    get listenerCount() {
      return listeners.length;
    },
  };
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

describe('getSystemTheme', () => {
  it('reads the OS preference', () => {
    mockSystemTheme(true);
    expect(getSystemTheme()).toBe('dark');
    mockSystemTheme(false);
    expect(getSystemTheme()).toBe('light');
  });
});

describe('applyTheme', () => {
  it('puts the dark class on <html> only when the theme is dark', () => {
    applyTheme('dark');
    expect(document.documentElement).toHaveClass('dark');

    applyTheme('light');
    expect(document.documentElement).not.toHaveClass('dark');
  });
});

describe('initTheme', () => {
  it('applies the dark class when the stored preference is dark', () => {
    localStorage.setItem(STORAGE_KEY, 'dark');
    initTheme();
    expect(document.documentElement).toHaveClass('dark');
  });

  it('lets a stored choice override the system preference in both directions', () => {
    localStorage.setItem(STORAGE_KEY, 'light');
    mockSystemTheme(true);
    initTheme();
    expect(document.documentElement).not.toHaveClass('dark');

    localStorage.setItem(STORAGE_KEY, 'dark');
    mockSystemTheme(false);
    initTheme();
    expect(document.documentElement).toHaveClass('dark');
  });

  // The bug #247 fixed: the old ThemeProvider persisted a system-derived value on mount, which
  // destroyed "follow the system" the first time the app ran. A theme has to keep following
  // until it is actually asked not to.
  it('does not persist a system-derived preference', () => {
    mockSystemTheme(true);
    initTheme();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});

/**
 * The subscription lives here rather than inside `initTheme` because `ThemeProvider` has to
 * hear about an OS change too — a listener that wrote the class on its own would leave the
 * toggle reporting a state the page no longer had, and its next click would be a no-op.
 */
describe('subscribeToSystemTheme', () => {
  it('reports an OS change', () => {
    const media = mockSystemTheme(false);
    const seen: string[] = [];
    subscribeToSystemTheme((theme) => seen.push(theme));

    media.emit(true);
    media.emit(false);

    expect(seen).toEqual(['dark', 'light']);
  });

  it('unsubscribes when asked', () => {
    const media = mockSystemTheme(false);
    const stop = subscribeToSystemTheme(() => {});
    expect(media.listenerCount).toBe(1);

    stop();

    expect(media.listenerCount).toBe(0);
  });

  it('is a no-op in a browser with no matchMedia', () => {
    window.matchMedia = undefined as unknown as typeof window.matchMedia;
    expect(() => subscribeToSystemTheme(() => {})()).not.toThrow();
  });

  it("does not touch the class itself — that is the provider's job", () => {
    const media = mockSystemTheme(false);
    subscribeToSystemTheme(() => {});

    media.emit(true);

    expect(document.documentElement).not.toHaveClass('dark');
  });
});

describe('hasStoredTheme', () => {
  it('is false while the visitor is still following their OS', () => {
    mockSystemTheme(true);
    initTheme();
    expect(hasStoredTheme()).toBe(false);
  });

  it('is true once they have chosen', () => {
    storeTheme('dark');
    expect(hasStoredTheme()).toBe(true);
  });

  it('ignores a corrupt stored value', () => {
    localStorage.setItem(STORAGE_KEY, 'banana');
    expect(hasStoredTheme()).toBe(false);
  });
});

describe('storeTheme', () => {
  it('persists the choice', () => {
    storeTheme('dark');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('dark');
  });

  it('does not throw when storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => storeTheme('dark')).not.toThrow();
  });

  it('degrades to the system setting when storage cannot be read', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    mockSystemTheme(true);
    expect(getInitialTheme()).toBe('dark');
  });
});
