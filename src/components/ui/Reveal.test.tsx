import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { act } from 'react';
import { Reveal } from './Reveal';

/**
 * jsdom gives every element a zero rect, so `top` is 0 and everything counts as arrived. These
 * tests drive `getBoundingClientRect` directly, which is the only input the sweep has.
 */
function placeAt(top: number) {
  return vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({ top } as DOMRect);
}

/**
 * The sweep throttles on rAF, so a test has to drive the frame. It has to stay *deferred* the
 * way a real one is: running the callback synchronously inside `requestAnimationFrame` would
 * let the returned id land after the callback had already cleared it, and the throttle would
 * then think a frame was permanently in flight.
 */
let frames: FrameRequestCallback[] = [];

function flushFrame() {
  const queued = frames;
  frames = [];
  act(() => queued.forEach((cb) => cb(0)));
}

/** A scroll, and the frame it schedules. */
function scroll(event: 'scroll' | 'resize' = 'scroll') {
  act(() => {
    window.dispatchEvent(new Event(event));
  });
  flushFrame();
}

beforeEach(() => {
  window.innerHeight = 1000;
  frames = [];
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb));
  vi.stubGlobal('cancelAnimationFrame', () => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const item = () => screen.getByText('innhold');

describe('Reveal', () => {
  it('reveals immediately when it is already on screen at mount', () => {
    placeAt(200);
    render(<Reveal>innhold</Reveal>);

    expect(item()).toHaveAttribute('data-revealed', 'true');
  });

  it('starts hidden when it is below the fold', () => {
    placeAt(2000);
    render(<Reveal>innhold</Reveal>);

    expect(item()).toHaveAttribute('data-revealed', 'false');
  });

  it('reveals once scrolling brings it up to the fold line', () => {
    const rect = placeAt(2000);
    render(<Reveal>innhold</Reveal>);

    rect.mockReturnValue({ top: 300 } as DOMRect);
    scroll();

    expect(item()).toHaveAttribute('data-revealed', 'true');
  });

  /**
   * The regression this component was rebuilt for. An IntersectionObserver reports threshold
   * crossings, so an element that goes from below the fold to above it inside one frame never
   * reports anything and stays at opacity 0 for the rest of the session. Jumping to the bottom
   * of a 17-card grid left twelve cards blank. A sweep asks where things are, not when they
   * crossed.
   */
  it('reveals an item that was scrolled straight past, never through, the viewport', () => {
    const rect = placeAt(2000);
    render(<Reveal>innhold</Reveal>);

    // One frame: below the fold, then well above the top of the screen.
    rect.mockReturnValue({ top: -4000 } as DOMRect);
    scroll();

    expect(item()).toHaveAttribute('data-revealed', 'true');
  });

  it('reveals on resize as well, since that moves the fold without a scroll', () => {
    const rect = placeAt(2000);
    render(<Reveal>innhold</Reveal>);

    rect.mockReturnValue({ top: 500 } as DOMRect);
    scroll('resize');

    expect(item()).toHaveAttribute('data-revealed', 'true');
  });

  // The listeners detach themselves once the last item is revealed, which is what makes the
  // sweep's cost go to zero rather than persist for the life of the page. Measured by whether
  // it still reads the element's rect, since that read *is* the cost.
  it('stops sweeping once nothing is left to reveal', () => {
    const rect = placeAt(2000);
    render(<Reveal>innhold</Reveal>);

    rect.mockReturnValue({ top: 100 } as DOMRect);
    scroll();
    expect(item()).toHaveAttribute('data-revealed', 'true');

    rect.mockClear();
    scroll();

    expect(rect).not.toHaveBeenCalled();
  });

  it('unregisters on unmount, so an unmounted item is never swept', () => {
    const rect = placeAt(2000);
    const { unmount } = render(<Reveal>innhold</Reveal>);

    unmount();
    rect.mockClear();
    scroll();

    expect(rect).not.toHaveBeenCalled();
  });

  describe('the stagger', () => {
    it('delays each item by its index', () => {
      placeAt(2000);
      render(<Reveal index={3}>innhold</Reveal>);

      expect(item()).toHaveStyle({ transitionDelay: 'calc(var(--duration-instant) * 3)' });
    });

    it('caps, so a long feed does not crawl in', () => {
      placeAt(2000);
      render(<Reveal index={40}>innhold</Reveal>);

      expect(item()).toHaveStyle({ transitionDelay: 'calc(var(--duration-instant) * 6)' });
    });

    it('sets no delay on the first item', () => {
      placeAt(2000);
      render(<Reveal index={0}>innhold</Reveal>);

      expect(item().style.transitionDelay).toBe('');
    });

    it('drops the delay once revealed, so nothing is left waiting on it', () => {
      placeAt(200);
      render(<Reveal index={3}>innhold</Reveal>);

      expect(item().style.transitionDelay).toBe('');
    });
  });

  it('carries the class the stylesheet keys off, and the caller own classes', () => {
    placeAt(200);
    render(<Reveal className="flex">innhold</Reveal>);

    expect(item()).toHaveClass('sbsk-reveal', 'flex');
  });

  // `lift*` owns `transition` outright, so a reveal must never be the same element as a lifting
  // one — it sets its own. Wrapping is the contract; this pins that it stays a wrapper.
  it('does not carry a lift utility of its own', () => {
    placeAt(200);
    render(<Reveal>innhold</Reveal>);

    expect(item().className).not.toMatch(/\blift/);
  });
});
