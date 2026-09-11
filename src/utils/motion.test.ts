import { describe, expect, it, vi } from 'vitest';
import {
  applyMotion,
  getInitialMotion,
  getSystemMotion,
  hasStoredMotion,
  initMotion,
  motionIsReduced,
  storeMotion,
  subscribeToSystemMotion,
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
});

/**
 * The subscription lives here rather than inside `initMotion` because `MotionProvider` has to
 * hear about an OS change too — a listener that wrote the class on its own would leave the
 * toggle reporting a state the page no longer had, and its next click would be a no-op.
 */
describe('subscribeToSystemMotion', () => {
  it('reports an OS change', () => {
    const media = mockSystemMotion(false);
    const seen: string[] = [];
    subscribeToSystemMotion((preference) => seen.push(preference));

    media.emit(true);
    media.emit(false);

    expect(seen).toEqual(['reduced', 'full']);
  });

  it('unsubscribes when asked', () => {
    const media = mockSystemMotion(false);
    const stop = subscribeToSystemMotion(() => {});
    expect(media.listenerCount).toBe(1);

    stop();

    expect(media.listenerCount).toBe(0);
  });

  it('is a no-op in a browser with no matchMedia', () => {
    window.matchMedia = undefined as unknown as typeof window.matchMedia;
    expect(() => subscribeToSystemMotion(() => {})()).not.toThrow();
  });

  it("does not touch the class itself — that is the provider's job", () => {
    const media = mockSystemMotion(false);
    subscribeToSystemMotion(() => {});

    media.emit(true);

    expect(document.documentElement).not.toHaveClass('reduce-motion');
  });
});

describe('hasStoredMotion', () => {
  it('is false while the visitor is still following their OS', () => {
    mockSystemMotion(true);
    initMotion();
    expect(hasStoredMotion()).toBe(false);
  });

  it('is true once they have chosen', () => {
    storeMotion('full');
    expect(hasStoredMotion()).toBe(true);
  });

  it('ignores a corrupt stored value', () => {
    localStorage.setItem(STORAGE_KEY, 'sideways');
    expect(hasStoredMotion()).toBe(false);
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
