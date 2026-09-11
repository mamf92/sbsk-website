import * as React from 'react';

/**
 * A list item settling into place as it scrolls into view.
 *
 * The brand bans `scale()`, blur, spread and soft shadows, and says of decorative motion that
 * nothing here rotates and nothing eases — so this is not a generic fade-up. It is the system's
 * own lift, played backwards: an item arrives held at the card hover offset on `--shadow-3` and
 * settles flat onto the page, which is the exact gesture a card makes when you stop hovering it.
 * Nothing new is invented, and nothing arrives that the design language does not already say.
 *
 * Three rules keep it from becoming decoration:
 *
 * - **It reveals once.** An item that re-animates every time it scrolls past is what makes a
 *   page feel restless rather than alive.
 * - **The stagger is capped.** `index` delays each item by `--duration-instant`, but only for
 *   the first `MAX_STAGGERED`. Past that every item shares the last delay, so a forty-post feed
 *   does not take three seconds to finish arriving.
 * - **Reduced motion gets the finished state, not a faster version of the motion.** That branch
 *   is pure CSS (`.reduce-motion` — see `index.css`), so it holds even for an item that has
 *   already been revealed.
 *
 * ## Why a scroll sweep and not IntersectionObserver
 *
 * The obvious build — observe each element, reveal on first intersection, disconnect — has a
 * failure mode that is unacceptable for something that starts at `opacity: 0`, and it is not
 * hypothetical: it shipped in the first version of this file and was caught on a real page.
 * An observer reports *threshold crossings*, so an element that goes from below the fold to
 * above it within a single frame — Cmd+End, a scrollbar drag, an anchor jump — never reports a
 * crossing at all. It stays at ratio 0 throughout, no callback fires, and that item is
 * invisible for the rest of the session. On a 17-card grid, jumping to the bottom left twelve
 * cards blank.
 *
 * A sweep has no such gap: it asks where things *are*, not when they crossed. The cost is a
 * rect read per pending element per animation frame while scrolling, which is nothing at these
 * counts, and it stops entirely once the last item has been revealed — the listeners detach
 * themselves. Correctness here is worth more than the observer's efficiency.
 */

type RevealProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Position in its list, for the stagger. */
  index?: number;
};

/** Past this many items the stagger stops growing. 6 × 80ms ≈ half a second, end to end. */
const MAX_STAGGERED = 6;

/**
 * Reveal slightly before the top edge reaches the fold, so an item is settled by the time it is
 * properly readable rather than moving under the reader's eye.
 */
const REVEAL_MARGIN = 0.1;

type Pending = { element: Element; reveal: () => void };

const pending = new Set<Pending>();
let frame = 0;
let listening = false;

/** Anything at or above the fold line — including anything already scrolled past it. */
function hasArrived(element: Element) {
  const { top } = element.getBoundingClientRect();
  return top <= window.innerHeight * (1 - REVEAL_MARGIN);
}

function sweep() {
  frame = 0;
  for (const entry of pending) {
    if (!hasArrived(entry.element)) continue;
    pending.delete(entry);
    entry.reveal();
  }
  if (pending.size === 0) stopListening();
}

function schedule() {
  if (frame) return;
  frame = requestAnimationFrame(sweep);
}

/**
 * Scrolling is not the only way an item arrives. The page reflowing under it counts too — an
 * image above it finishing loading, a web font landing, a filter removing the rows in front of
 * it — and none of those fire a scroll. Observing the document element catches every one of
 * them that changes the page's height.
 */
let reflow: ResizeObserver | null = null;

function startListening() {
  if (listening) return;
  listening = true;
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });

  if (typeof ResizeObserver === 'function') {
    reflow ??= new ResizeObserver(schedule);
    reflow.observe(document.documentElement);
  }
}

function stopListening() {
  if (!listening) return;
  listening = false;
  window.removeEventListener('scroll', schedule);
  window.removeEventListener('resize', schedule);
  reflow?.disconnect();
  if (frame) {
    cancelAnimationFrame(frame);
    frame = 0;
  }
}

export function Reveal({ className = '', index = 0, children, ...props }: RevealProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [shown, setShown] = React.useState(false);

  React.useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Anything already on screen at mount is revealed without waiting for a scroll that may
    // never come — a short page, or a visitor who simply reads what is in front of them.
    if (hasArrived(element)) {
      setShown(true);
      return;
    }

    const entry: Pending = { element, reveal: () => setShown(true) };
    pending.add(entry);
    startListening();

    return () => {
      pending.delete(entry);
      if (pending.size === 0) stopListening();
    };
  }, []);

  /**
   * Deliberately has no dependency array. A list that filters or re-sorts *reorders* its items
   * rather than remounting them — same key, same component instance — so the effect above never
   * runs again and no scroll fires, and a card that was below the fold and is now on screen
   * would sit at `opacity: 0` as an empty grid cell. Re-checking on every render is what
   * corresponds to "the list changed". The sweep is rAF-throttled and returns immediately once
   * nothing is pending, so a settled page pays a `Set.size` check.
   */
  React.useLayoutEffect(() => {
    if (!shown) schedule();
  });

  return (
    <div
      ref={ref}
      data-revealed={shown ? 'true' : 'false'}
      // The delay has to survive the reveal. `transition-delay` is taken from the *after-change*
      // style, so clearing it in the same commit that flips `data-revealed` means every item
      // transitions with 0s and the stagger never plays at all — which is exactly what this
      // component shipped doing.
      style={
        index <= 0
          ? undefined
          : {
              transitionDelay: `calc(var(--duration-instant) * ${Math.min(index, MAX_STAGGERED)})`,
            }
      }
      className={['sbsk-reveal', className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </div>
  );
}
