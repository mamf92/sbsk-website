import { describe, expect, it, vi } from 'vitest';
import {
  applyMotion,
  getInitialMotion,
  getSystemMotion,
  initMotion,
  motionIsReduced,
  storeMotion,
} from './motion';

const STORAGE_KEY = 'motion-preference';

type Listener = (event: MediaQueryListEvent) => void;

/**
 * The same shape as `theme.test.ts`'s helper, plus a handle on the `change` listener — the
 * subscription is the behaviour that separates this module from `theme.ts`, so the tests have
 * to be able to fire it.
 */
function mockSystemMotion(reduce: boolean) {
  const listeners: Listener[] = [];
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: reduce,
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

describe('getInitialMotion', () => {
  it('prefers a stored preference over the system setting', () => {
    localStorage.setItem(STORAGE_KEY, 'full');
    mockSystemMotion(true);
    expect(getInitialMotion()).toBe('full');
  });

  it('falls back to the system setting when nothing is stored', () => {
    mockSystemMotion(true);
    expect(getInitialMotion()).toBe('reduced');
  });

  it('ignores a corrupt stored value', () => {
    localStorage.setItem(STORAGE_KEY, 'sideways');
    mockSystemMotion(false);
    expect(getInitialMotion()).toBe('full');
  });
});

describe('getSystemMotion', () => {
  it('reads the OS preference', () => {
    mockSystemMotion(true);
    expect(getSystemMotion()).toBe('reduced');
    mockSystemMotion(false);
    expect(getSystemMotion()).toBe('full');
  });
});

describe('applyMotion', () => {
  it('puts the class on <html> only when motion is reduced', () => {
    applyMotion('reduced');
    expect(document.documentElement).toHaveClass('reduce-motion');
    expect(motionIsReduced()).toBe(true);

    applyMotion('full');
    expect(document.documentElement).not.toHaveClass('reduce-motion');
    expect(motionIsReduced()).toBe(false);
  });
});

describe('initMotion', () => {
  it('applies the system preference when the visitor has not chosen', () => {
    mockSystemMotion(true);
    initMotion();
    expect(document.documentElement).toHaveClass('reduce-motion');
  });

  it('lets a stored choice override the system preference in both directions', () => {
    localStorage.setItem(STORAGE_KEY, 'full');
    mockSystemMotion(true);
    initMotion();
    expect(document.documentElement).not.toHaveClass('reduce-motion');

    localStorage.setItem(STORAGE_KEY, 'reduced');
    mockSystemMotion(false);
    initMotion();
    expect(document.documentElement).toHaveClass('reduce-motion');
  });

  // The reason storage is written only by an explicit toggle: `ThemeProvider` persists a
  // system-derived value on mount, which destroys "follow the system" the first time the app
  // runs. A motion preference has to keep following until it is actually asked not to.
  it('does not persist a system-derived preference', () => {
    mockSystemMotion(true);
    initMotion();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('follows a mid-session OS change while nothing is stored', () => {
    const media = mockSystemMotion(false);
    initMotion();
    expect(document.documentElement).not.toHaveClass('reduce-motion');

    media.emit(true);
    expect(document.documentElement).toHaveClass('reduce-motion');
  });

  it('stops following the OS once the visitor has chosen for themselves', () => {
    const media = mockSystemMotion(false);
    initMotion();
    storeMotion('full');

    media.emit(true);
    expect(document.documentElement).not.toHaveClass('reduce-motion');
  });

  it('unsubscribes when asked, and survives a browser with no matchMedia', () => {
    const media = mockSystemMotion(false);
    const stop = initMotion();
    expect(media.listenerCount).toBe(1);
    stop();
    expect(media.listenerCount).toBe(0);

    window.matchMedia = undefined as unknown as typeof window.matchMedia;
    expect(() => initMotion()()).not.toThrow();
  });
});

describe('storeMotion', () => {
  it('persists the choice', () => {
    storeMotion('reduced');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('reduced');
  });

  it('does not throw when storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => storeMotion('reduced')).not.toThrow();
  });

  it('degrades to the system setting when storage cannot be read', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    mockSystemMotion(true);
    expect(getInitialMotion()).toBe('reduced');
  });
});
