import * as React from 'react';
import Expand from '../../assets/icons/arrows/expand.svg?react';
import { ImageGallery, type GalleryImage } from './ImageGallery';

export type CardCategory = 'nyheter' | 'spillkveld' | 'arrangementer' | 'turnering' | 'annet';

// `title` is widened from the native `string` so a caller can pass marked-up copy.
type CardProps = Omit<React.HTMLAttributes<HTMLElement>, 'title'> & {
  category?: CardCategory;
  date?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  // `image` doubles as the closed-card thumbnail and the first image of the panel gallery —
  // there is deliberately no separate "teaser" image, so the photo a reader sees closed is
  // the same one that opens the gallery.
  image?: string;
  imageAlt?: string;
  gallery?: GalleryImage[];
  expanded?: boolean;
  onToggle?: () => void;
};

// A flat solid block with sharp corners and a brand-black hairline — no radius, no blur.
// `lift-card` (src/index.css) carries the hover and open elevation, so no `transition-*`
// utility may join it on this element.
const base = 'relative w-full rounded-none border border-black font-body';

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
      imageAlt = '',
      gallery = [],
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
    const hasBody = children != null || image != null;
    const open = interactive ? expanded : true;

    const header = (
      <>
        {image ? (
          <img
            src={image}
            alt=""
            aria-hidden="true"
            className="size-20 flex-none border border-black object-cover sm:size-24"
          />
        ) : null}
        <span className="flex min-w-0 flex-1 flex-col gap-1 text-left">
          {date ? <span className="text-sm font-normal">{date}</span> : null}
          <span className="font-heading text-h3 font-bold">{title}</span>
          {subtitle ? <span className="text-base font-normal">{subtitle}</span> : null}
        </span>
        {interactive ? (
          <span className="flex size-7 flex-none items-center justify-center">
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
              className="focus-visible:outline-focus-ring flex w-full cursor-pointer items-center justify-between gap-4 p-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2"
            >
              {header}
            </button>
          ) : (
            <div className="flex w-full items-center justify-between gap-4 p-4">{header}</div>
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
              <div className={`${panels[category]} flex flex-col gap-4 border-t border-black p-4`}>
                {image ? (
                  <ImageGallery images={[{ src: image, alt: imageAlt }, ...gallery]} />
                ) : null}
                {children ? <div className="sbsk-rt">{children}</div> : null}
              </div>
            </div>
          </div>
        ) : null}
      </article>
    );
  },
);

Card.displayName = 'Card';
