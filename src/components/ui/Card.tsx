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
  // The header's own call-to-action row — `PostsSection`'s post links, moved out of the panel
  // and into the space the thumbnail vacates on open (#203). Only ever rendered while `open`,
  // same guard as the thumbnail collapse: a closed card has nothing to put there. Never assume
  // exactly one or two — a caller may pass any number.
  actions?: React.ReactNode;
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

// Which hard-shadow colour `actions`' `Button`s can carry against the header's own fill —
// see the pairing table by `surface-light`/`surface-dark` in `src/index.css`. This belongs on
// the header's own wrapper, not on `<article>`: the article carries `lift-card`, which casts
// the card's *own* shadow onto the page behind it, and repointing that at the header's colour
// would answer a different question (#203).
const headerSurfaces = {
  nyheter: 'surface-dark',
  spillkveld: 'surface-light',
  arrangementer: 'surface-light',
  turnering: 'surface-light',
  annet: 'surface-light',
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
      actions,
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
    const hasActions = actions != null && open;

    // Grid, not a single flex row: `actions` and the chevron have to sit between the text and
    // the card's right edge on a wide screen, but below the text — as their own full-width row
    // — on a narrow one, with the chevron staying a single column spanning both. A flex row
    // cannot reflow like that without either duplicating the actions markup per breakpoint or
    // reordering DOM nodes with `order`, which still leaves one layout's row circling back
    // through the other's column. `[1fr_auto]` narrow, `[1fr_auto_auto]` wide — text, chevron;
    // text, actions, chevron.
    //
    // The `min-h-24 sm:min-h-28` on `image` still belongs on the grid rather than the toggle
    // inside it: the thumbnail's own `w-24 sm:w-28` floor needs a row at least that tall before
    // it has anything to stretch against.
    const headerGrid =
      `grid w-full grid-cols-[1fr_auto] sm:grid-cols-[1fr_auto_auto] ${headerSurfaces[category]}` +
      (image ? ' min-h-24 sm:min-h-28' : '');

    // The padding moves off the header row and onto the text and the chevron, so the thumbnail
    // can sit flush against the card's own top, left and bottom borders. A photo inset by 16px
    // reads as a stray icon; one bled to the edge reads as the card's picture.
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
            // `w-24 sm:w-28` — a fixed width, not `aspect-square`. A first attempt derived the
            // width from the row's own stretched height via `aspect-square`, which broke in a
            // genuinely nasty way: the text column is `min-w-0` (free to shrink and wrap
            // word-by-word), so a wider image left less room for text, which wrapped more, which
            // grew the row taller, which (via the aspect ratio) grew the image wider still — a
            // feedback loop that ran the thumbnail up to nearly the full card width on a narrow
            // screen before anything capped it.
            //
            // Fixing only the width sidesteps that loop the same way fixing both dimensions did
            // (the text column's available space still never depends on the image's own cross
            // size), but lets the height be `h-full` instead of a second fixed number — so a
            // subtitle that wraps past two lines grows the row, and the thumbnail grows with it
            // instead of stopping short and leaving a band of header colour under a
            // now-too-short square. `object-cover` keeps the crop centred as it stretches; the
            // image reads as square at the row's usual height and as a taller strip once a long
            // subtitle pushes past it, rather than as a fixed square floating above empty space.
            className={[
              'flex-none object-cover',
              'transition-[width,border-right-width] duration-(--duration-slow) ease-out',
              'motion-reduce:transition-none',
              thumbnailCollapsed
                ? 'h-full w-0 border-r-0'
                : 'h-full w-24 border-r border-black sm:w-28 dark:border-white',
            ].join(' ')}
          />
        ) : null}
        <span className="flex min-w-0 flex-1 flex-col justify-center gap-1 p-4 text-left">
          {date ? <span className="text-sm font-normal">{date}</span> : null}
          <span className="font-heading text-h3 font-bold">{title}</span>
          {subtitle ? <span className="text-base font-normal">{subtitle}</span> : null}
        </span>
      </>
    );

    return (
      <article
        ref={ref}
        data-expanded={open ? 'true' : 'false'}
        className={[base, headers[category], interactive ? 'lift-card' : '', className].join(' ')}
        {...props}
      >
        <div className={headerGrid}>
          {/* Heading wraps the toggle rather than sitting inside it: a heading is flow content
              and a button only takes phrasing content, so the other nesting is invalid HTML.
              `actions` is flow content too — a caller's `Button`s, and a button cannot nest
              inside another button regardless — which is why it and the chevron sit here as
              the heading's grid siblings instead of inside it. The toggle no longer covers the
              full header row the way it did before `actions` existed; it still covers the
              thumbnail and the title, the largest and most obvious target. */}
          <h3 className="col-start-1 row-start-1 min-w-0">
            {interactive ? (
              <button
                type="button"
                onClick={onToggle}
                aria-expanded={open}
                aria-controls={hasBody ? panelId : undefined}
                className="focus-visible:outline-focus-ring flex h-full w-full cursor-pointer items-stretch text-left focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2"
              >
                {header}
              </button>
            ) : (
              <div className="flex h-full w-full items-stretch">{header}</div>
            )}
          </h3>

          {hasActions ? (
            <div
              className={
                'col-start-1 row-start-2 flex flex-row flex-wrap items-center gap-2 p-4 pt-0 ' +
                'sm:col-start-2 sm:row-start-1 sm:flex-col sm:items-stretch sm:justify-center sm:pt-4'
              }
            >
              {actions}
            </div>
          ) : null}

          {interactive ? (
            // Not a second `<button>` — that would duplicate the h3 button's tab stop for
            // the same action. `aria-hidden` keeps it out of the accessibility tree, and the
            // click handler makes it a mouse/touch-only bonus target so the chevron itself is
            // clickable again, closing the gap the header grid opened when `actions` (a real
            // sibling, never nested — see the h3 button above) split the row (#208).
            <span
              aria-hidden="true"
              onClick={onToggle}
              className={
                'col-start-2 row-start-1 flex flex-none cursor-pointer items-center justify-center px-4' +
                (hasActions ? ' row-span-2 sm:col-start-3 sm:row-span-1' : '')
              }
            >
              <Expand
                className={
                  'h-5 w-5 fill-current transition-transform duration-(--duration-base) ease-out ' +
                  'motion-reduce:transition-none ' +
                  (open ? 'rotate-180' : 'rotate-0')
                }
              />
            </span>
          ) : null}
        </div>
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
