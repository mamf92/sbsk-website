import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { act } from 'react';
import { Reveal } from './Reveal';

type Observed = { target: Element; isIntersecting: boolean };

/**
 * Deliberately thin, and deliberately local rather than in `src/test/setup.ts`: it records what
 * was observed and fires only when a test says so. What it does *not* emulate is the part that
 * matters — whether an element is really on screen, and the rootMargin that decides when — so a
 * reveal that fires at the wrong moment cannot pass here. That is the browser's job.
 */
function stubObserver() {
  const instances: {
    callback: (entries: Observed[]) => void;
    observed: Set<Element>;
    disconnected: boolean;
  }[] = [];

  class FakeObserver {
    observed = new Set<Element>();
    disconnected = false;
    callback: (entries: Observed[]) => void;

    constructor(callback: (entries: Observed[]) => void) {
      this.callback = callback;
      instances.push(this);
    }
    observe(target: Element) {
      this.observed.add(target);
    }
    unobserve(target: Element) {
      this.observed.delete(target);
    }
    disconnect() {
      this.disconnected = true;
      this.observed.clear();
    }
    takeRecords() {
      return [];
    }
  }

  vi.stubGlobal('IntersectionObserver', FakeObserver);

  return {
    instances,
    scrollIntoView() {
      act(() => {
        instances.forEach((observer) =>
          observer.callback(
            Array.from(observer.observed, (target) => ({ target, isIntersecting: true })),
          ),
        );
      });
    },
  };
}

afterEach(() => vi.unstubAllGlobals());

describe('Reveal', () => {
  it('starts hidden and settles once it scrolls into view', () => {
    const observer = stubObserver();
    render(<Reveal>innhold</Reveal>);

    expect(screen.getByText('innhold')).toHaveAttribute('data-revealed', 'false');

    observer.scrollIntoView();

    expect(screen.getByText('innhold')).toHaveAttribute('data-revealed', 'true');
  });

  it('stops observing once it has fired, so it never replays', () => {
    const observer = stubObserver();
    render(<Reveal>innhold</Reveal>);

    observer.scrollIntoView();

    expect(observer.instances.every((instance) => instance.disconnected)).toBe(true);
  });

  it('ignores an entry that is not intersecting', () => {
    const observer = stubObserver();
    render(<Reveal>innhold</Reveal>);

    act(() => {
      observer.instances[0].callback([
        { target: screen.getByText('innhold'), isIntersecting: false },
      ]);
    });

    expect(screen.getByText('innhold')).toHaveAttribute('data-revealed', 'false');
  });

  // Failing open matters more than the effect: the alternative is permanently invisible content.
  it('renders finished when the browser has no IntersectionObserver', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    render(<Reveal>innhold</Reveal>);

    expect(screen.getByText('innhold')).toHaveAttribute('data-revealed', 'true');
  });

  describe('the stagger', () => {
    it('delays each item by its index', () => {
      stubObserver();
      render(<Reveal index={3}>innhold</Reveal>);

      expect(screen.getByText('innhold')).toHaveStyle({
        transitionDelay: 'calc(var(--duration-instant) * 3)',
      });
    });

    it('caps, so a long feed does not crawl in', () => {
      stubObserver();
      render(<Reveal index={40}>innhold</Reveal>);

      expect(screen.getByText('innhold')).toHaveStyle({
        transitionDelay: 'calc(var(--duration-instant) * 6)',
      });
    });

    it('sets no delay on the first item', () => {
      stubObserver();
      render(<Reveal index={0}>innhold</Reveal>);

      expect(screen.getByText('innhold').style.transitionDelay).toBe('');
    });

    it('drops the delay once revealed, so nothing is left waiting on it', () => {
      const observer = stubObserver();
      render(<Reveal index={3}>innhold</Reveal>);

      observer.scrollIntoView();

      expect(screen.getByText('innhold').style.transitionDelay).toBe('');
    });
  });

  it('carries the class the stylesheet keys off, and the caller own classes', () => {
    stubObserver();
    render(<Reveal className="flex">innhold</Reveal>);

    expect(screen.getByText('innhold')).toHaveClass('sbsk-reveal', 'flex');
  });

  // `lift*` owns `transition` outright, so a reveal wrapper must never be the same element as a
  // lifting one — it sets its own. Wrapping is the contract; this pins that it stays a wrapper.
  it('does not carry a lift utility of its own', () => {
    stubObserver();
    render(<Reveal>innhold</Reveal>);

    expect(screen.getByText('innhold').className).not.toMatch(/\blift/);
  });
});
