import * as React from 'react';
import Expand from '../../assets/icons/arrows/expand.svg?react';

export type CardCategory = 'nyheter' | 'spillkveld' | 'arrangementer' | 'turnering' | 'annet';

// `title` is widened from the native `string` so a caller can pass marked-up copy.
type CardProps = Omit<React.HTMLAttributes<HTMLElement>, 'title'> & {
  category?: CardCategory;
  date?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  // The closed card's thumbnail. It is decorative here — the title beside it already says what
  // the post is, and this sits inside the toggle button, where alt text would be read out as
  // part of the control's name. The photo itself reappears, captioned, inside the panel.
  image?: string;
  // `object-position` for the thumbnail, so a header that stretches taller than the square crop
  // still keeps the subject in frame. See `hotspotPosition` in `SanityImage.tsx`.
  imagePosition?: string;
  expanded?: boolean;
  onToggle?: () => void;
};

// A flat solid block with sharp corners and a brand-black hairline — no radius, no blur.
// `lift-card` (src/index.css) carries the hover and open elevation, so no `transition-*`
// utility may join it on this element.
const base = 'relative w-full rounded-none border border-black dark:border-white font-body';

// The fill is the whole visual signal. The header takes the category colour and the panel a
// second step of it, so an open card reads as one block in two tones rather than as a card
// with a tray bolted underneath. `turnering` is a spillkveld with stakes and `annet` is the
// arrangementer catch-all, so each borrows its parent's pair rather than inventing a colour.
const headers = {
  nyheter: 'bg-darkblue text-white',
  spillkveld: 'bg-orange text-darkestblue',
  arrangementer: 'bg-darkorange text-darkestblue',
  turnering: 'bg-orange text-darkestblue',
  annet: 'bg-darkorange text-darkestblue',
} as const;

// The panel carries a `surface-*` tone and the header deliberately does not. `children` is
// caller-supplied and routinely holds `Button`s — PostsSection puts the post's links there — so
// the panel has to declare which hard shadow its fill can carry; a `nyheter` panel is
// `darkestblue` and the default shadow is the same colour, which is where #139's exact 1:1 row
// came from. The header fill sits on the `<article>` itself, which is the element that lifts,
// and a `surface-*` there would repoint the card's *own* shadow onto the page behind it.
const panels = {
  nyheter: 'bg-darkestblue surface-dark text-white',
  spillkveld: 'bg-darkorange surface-light text-darkestblue',
  arrangementer: 'bg-orange surface-light text-darkestblue',
  turnering: 'bg-darkorange surface-light text-darkestblue',
  annet: 'bg-orange surface-light text-darkestblue',
} as const;

export const Card = React.forwardRef<HTMLElement, CardProps>(
  (
    {
      className = '',
      category = 'nyheter',
      date,
      title,
      subtitle,
      image,
      imagePosition,
      expanded = false,
      onToggle,
      children,
      ...props
    },
    ref,
  ) => {
    const panelId = React.useId();
    // No toggle handler means this is a static block: no chevron, no cursor, no lift, and
    // the body simply renders. `expanded` is meaningless without something to collapse to.
    const interactive = typeof onToggle === 'function';
    const hasBody = children != null;
    const open = interactive ? expanded : true;
    // The same photo reappears, properly framed, in the body below once a card opens — so the
    // header's small copy shrinks away rather than sitting there duplicated. Guarded to
    // interactive cards with a body: `open` is unconditionally `true` on a static card (nothing
    // to replace the thumbnail with), so collapsing there would just make the photo vanish.
    const thumbnailCollapsed = interactive && hasBody && open;

    // The padding moves off the header row and onto the text and the chevron, so the thumbnail
    // can sit flush against the card's own top, left and bottom borders. A photo inset by 16px
    // reads as a stray icon; one bled to the edge reads as the card's picture.
    const headerRow =
      'flex w-full items-stretch justify-between' + (image ? ' min-h-24 sm:min-h-28' : '');

    const header = (
      <>
        {image ? (
          <img
            src={image}
            alt=""
            aria-hidden="true"
            style={imagePosition ? { objectPosition: imagePosition } : undefined}
            // The row's own `gap-4` used to double up with the text span's `p-4`, so removing it
            // (below) meant the thumbnail's width and its trailing border have to be the only
            // things collapsing here — `border-right-width` is transitioned alongside `width`
            // because a bare `border-r` at zero width still paints a 1px rule with nothing left
            // to clip it. Same clock as the panel's own `grid-template-rows` transition, so the
            // photo sliding shut and the panel opening read as one motion.
            //
            // `size-24 sm:size-28` — an explicit equal width and height, not `aspect-square`
            // derived from the row's stretched height. That was the first attempt, and it broke
            // in a genuinely nasty way: the text column is `min-w-0` (free to shrink and wrap
            // word-by-word), so a wider image leaves less room for text, which wraps more, which
            // grows the row's height, which (via aspect-ratio) grows the image wider still — a
            // feedback loop that ran the thumbnail up to nearly the full card width on a narrow
            // screen before anything capped it. Two independent, fixed dimensions can't feed that
            // loop. It's larger than the old `w-20 sm:w-24` — genuinely square and a bit more
            // presence — but it no longer tracks the header's height, which the row's own
            // `min-h-24 sm:min-h-28` (above) is sized to match instead.
            className={[
              'flex-none object-cover',
              'transition-[width,border-right-width] duration-(--duration-slow) ease-out',
              'motion-reduce:transition-none',
              thumbnailCollapsed
                ? 'w-0 border-r-0'
                : 'size-24 border-r border-black sm:size-28 dark:border-white',
            ].join(' ')}
          />
        ) : null}
        <span className="flex min-w-0 flex-1 flex-col justify-center gap-1 p-4 text-left">
          {date ? <span className="text-sm font-normal">{date}</span> : null}
          <span className="font-heading text-h3 font-bold">{title}</span>
          {subtitle ? <span className="text-base font-normal">{subtitle}</span> : null}
        </span>
        {interactive ? (
          <span className="mr-4 flex size-7 flex-none items-center justify-center self-center">
            <Expand
              aria-hidden="true"
              className={
                'h-5 w-5 fill-current transition-transform duration-(--duration-base) ease-out ' +
                'motion-reduce:transition-none ' +
                (open ? 'rotate-180' : 'rotate-0')
              }
            />
          </span>
        ) : null}
      </>
    );

    return (
      <article
        ref={ref}
        data-expanded={open ? 'true' : 'false'}
        className={[base, headers[category], interactive ? 'lift-card' : '', className].join(' ')}
        {...props}
      >
        {/* Heading wraps the control rather than sitting inside it: a heading is flow content
            and a button only takes phrasing content, so the other nesting is invalid HTML.
            This is also the WAI-ARIA accordion shape — the whole header row is the target. */}
        <h3>
          {interactive ? (
            <button
              type="button"
              onClick={onToggle}
              aria-expanded={open}
              aria-controls={hasBody ? panelId : undefined}
              className={`${headerRow} focus-visible:outline-focus-ring cursor-pointer text-left focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2`}
            >
              {header}
            </button>
          ) : (
            <div className={headerRow}>{header}</div>
          )}
        </h3>
        {hasBody ? (
          // `grid-template-rows: 0fr → 1fr` rather than the library's `max-height: 0 → 800px`.
          // Both animate identically, but the max-height version silently clips any post
          // taller than its magic number, and a news post with images clears 800px easily.
          // `inert` is what actually hides the collapsed panel: 0fr leaves its links in the
          // tab order and the accessibility tree, visible to nobody but a keyboard.
          <div
            id={panelId}
            inert={!open}
            className={
              'grid transition-[grid-template-rows] duration-(--duration-slow) ease-out ' +
              'motion-reduce:transition-none ' +
              (open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')
            }
          >
            <div className="overflow-hidden">
              <div
                className={`${panels[category]} flex flex-col gap-4 border-t border-black p-4 dark:border-white`}
              >
                {/* `flow-root`: a floated inline image or carousel (see `postsImageComponent.tsx`
                    and `PostsSection.tsx`) must not be able to poke out past this panel's tinted
                    fill and the card's own border. That containment happens to hold today because
                    this div is a flex item of the row above it, but that's invisible and would
                    silently break the day this layout changes — one class of cheap insurance. */}
                {children ? <div className="sbsk-rt flow-root">{children}</div> : null}
              </div>
            </div>
          </div>
        ) : null}
      </article>
    );
  },
);

Card.displayName = 'Card';
