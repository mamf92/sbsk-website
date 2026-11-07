import { describe, expect, it, vi } from 'vitest';
import {
  applyMotion,
  getInitialMotion,
  getSystemMotion,
  initMotion,
  motionIsReduced,
  subscribeToSystemMotion,
} from './motion';

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
  it('falls back to the system setting when nothing is stored', () => {
    mockSystemMotion(true);
    expect(getInitialMotion()).toBe('reduced');
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

  // The reason storage is written only by an explicit toggle: `ThemeProvider` persists a
  // system-derived value on mount, which destroys "follow the system" the first time the app
  // runs. A motion preference has to keep following until it is actually asked not to.
  it('ignores an old stored preference from the retired on-site switch', () => {
    localStorage.setItem('motion-preference', 'reduced');
    mockSystemMotion(false);
    initMotion();
    expect(motionIsReduced()).toBe(false);
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
