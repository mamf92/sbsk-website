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
 * - **It fires once.** The observer unobserves on first intersection. Content that re-animates
 *   every time it scrolls past is the thing that makes a page feel restless rather than alive.
 * - **The stagger is capped.** `index` delays each item by `--duration-instant`, but only for
 *   the first `MAX_STAGGERED`. Past that every item shares the last delay, so a forty-post feed
 *   does not take three seconds to finish arriving.
 * - **Reduced motion gets the finished state, not a faster version of the motion.** That branch
 *   is pure CSS (`.reduce-motion` — see `index.css`), so it holds even for content that has
 *   already been observed.
 *
 * It also renders finished when `IntersectionObserver` is missing. Failing open matters more
 * than the effect: the alternative is content that is permanently invisible.
 */

type RevealProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Position in its list, for the stagger. */
  index?: number;
};

/** Past this many items the stagger stops growing. 6 × 80ms ≈ half a second, end to end. */
const MAX_STAGGERED = 6;

/**
 * Start the transition slightly before the item's top edge reaches the fold, so it is settled
 * by the time it is properly readable rather than moving under the reader's eye.
 */
const ROOT_MARGIN = '0px 0px -10% 0px';

function supportsObserver() {
  return typeof window !== 'undefined' && typeof window.IntersectionObserver === 'function';
}

export function Reveal({ className = '', index = 0, children, ...props }: RevealProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  // Seeded `true` when there is no observer to tell us otherwise, so the content is never
  // stuck hidden. `useState`'s initialiser runs on the client only here, which is what makes
  // reading `window` in it safe.
  const [shown, setShown] = React.useState(() => !supportsObserver());

  React.useEffect(() => {
    const element = ref.current;
    if (shown || !element || !supportsObserver()) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setShown(true);
        observer.disconnect();
      },
      { rootMargin: ROOT_MARGIN },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [shown]);

  return (
    <div
      ref={ref}
      data-revealed={shown ? 'true' : 'false'}
      style={
        shown || index <= 0
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
