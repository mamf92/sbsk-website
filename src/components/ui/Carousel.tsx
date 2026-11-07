import * as React from 'react';
import { Link } from './Link';
import { Button } from './Buttons';
import { Dialog } from './Dialog';
import { clampAspect, cropUrl, hotspotPosition } from '../../utils/sanityImage';
import type { SanityImageValue } from './SanityImage';

// The arrows sit on the photo, so they bring a fixed light chip of their own (`surface-light`
// pins the ink) and stay legible on any picture, in either theme.
const ARROW_WRAP = 'surface-light absolute top-1/2 -translate-y-1/2 bg-white/90';

type CarouselProps = Omit<React.HTMLAttributes<HTMLElement>, 'children'> & {
  images: SanityImageValue[];
  /** Index shown first. Clamped into range; defaults to 0. */
  initialIndex?: number;
  /** Names the region for assistive tech. Defaults to a generic label. */
  label?: string;
};

// Layout-driven, not photo-driven, unlike `SanityImage`'s own aspect clamp: the box has to stay
// the same shape as the reader pages through photos of different ratios (a real photo set can
// range from ~1.5:1 to ~2.9:1), so it's fixed rather than computed per image.
const MAIN_ASPECT = 3 / 2;

// A finger drag has to clear this many CSS pixels, and be more horizontal than vertical, before
// it counts as a page rather than a vertical scroll passing through the image.
const SWIPE_THRESHOLD = 40;

function clampIndex(index: number, length: number) {
  return Math.min(Math.max(index, 0), Math.max(length - 1, 0));
}

export const Carousel = React.forwardRef<HTMLElement, CarouselProps>(
  ({ className = '', images, initialIndex = 0, label = 'Bildekarusell', ...props }, ref) => {
    const [index, setIndex] = React.useState(() => clampIndex(initialIndex, images.length));
    const [lightboxOpen, setLightboxOpen] = React.useState(false);
    const count = images.length;

    // A drag start, and whether it already crossed the swipe threshold — read by the image's
    // `onClick` so a swipe that ends over the image doesn't also open the lightbox. Refs, not
    // state: neither value should ever cause a render on its own.
    const dragStart = React.useRef<{ x: number; y: number; type: string } | null>(null);
    const didSwipe = React.useRef(false);

    if (count === 0) return null;

    const current = images[index];
    const hasControls = count > 1;
    const prev = () => setIndex((i) => (i - 1 + count) % count);
    const next = () => setIndex((i) => (i + 1) % count);
    const closeLightbox = () => setLightboxOpen(false);

    const onKeyDown = (event: React.KeyboardEvent) => {
      if (!hasControls) return;
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        prev();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        next();
      }
    };

    // Touch and pen only — `pointerType === 'mouse'` bails immediately, so a mouse drag is
    // just a drag (native image drag, text selection) and a mouse click always opens the
    // lightbox with no swipe-vs-click ambiguity to suppress.
    const onImagePointerDown = (event: React.PointerEvent) => {
      dragStart.current = { x: event.clientX, y: event.clientY, type: event.pointerType };
      didSwipe.current = false;
    };

    const onImagePointerUp = (event: React.PointerEvent) => {
      const start = dragStart.current;
      dragStart.current = null;
      if (!start || start.type === 'mouse') return;

      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
        didSwipe.current = true;
        if (dx > 0) prev();
        else next();
      }
    };

    const onImageClick = () => {
      // A swipe that lifted over the image fires this `click` right behind it (the browser's
      // own tap-to-click synthesis). Consume the flag rather than checking it — the next click
      // is a fresh tap and must open the lightbox again.
      if (didSwipe.current) {
        didSwipe.current = false;
        return;
      }
      setLightboxOpen(true);
    };

    const dimensions = current.asset?.metadata?.dimensions;
    const candidates = [480, 720, 960]
      .map((width) => (dimensions?.width ? Math.min(width, dimensions.width) : width))
      .filter((width, i, all) => all.indexOf(width) === i);

    // The lightbox shows the photo at its own shape, clamped to the same band `SanityImage`
    // uses — `MAIN_ASPECT` is a fixed strip aspect the inline carousel needs so a reader
    // paging through photos of different ratios doesn't see the box resize under them; a
    // full-screen view has no such neighbour to stay level with, so it can show the actual
    // photo instead of a second 3:2 crop of it.
    const naturalAspect =
      dimensions?.aspectRatio ??
      (dimensions?.width && dimensions?.height ? dimensions.width / dimensions.height : undefined);
    const lightboxAspect = clampAspect(naturalAspect);
    const lightboxCandidates = [960, 1440, 1920]
      .map((width) => (dimensions?.width ? Math.min(width, dimensions.width) : width))
      .filter((width, i, all) => all.indexOf(width) === i);

    const credit =
      current.imageSourceName && current.imageSourceUrl ? (
        <Link
          href={current.imageSourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          variant="inherit"
          className="underline"
        >
          Foto: {current.imageSourceName}
        </Link>
      ) : null;

    const imageLabel = current.alt
      ? `Vis «${current.alt}» i full størrelse`
      : 'Vis bildet i full størrelse';

    // Shared between the inline strip and the lightbox — both page the same `index`, so the
    // arrows have to be one piece of JSX rather than two copies that could drift apart.
    const arrowControls = hasControls ? (
      <>
        <span className={`${ARROW_WRAP} left-2`}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            icon="left"
            aria-label="Forrige bilde"
            onClick={prev}
          />
        </span>
        <span className={`${ARROW_WRAP} right-2`}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            icon="right"
            aria-label="Neste bilde"
            onClick={next}
          />
        </span>
      </>
    ) : null;

    const tickRow = hasControls ? (
      <>
        {/* The one position indicator: square ticks (no dots, the corners are square), each a
            real, labelled 24px button. The current one is filled. */}
        <div className="flex shrink-0 flex-wrap items-center justify-center gap-1.5">
          {images.map((_image, i) => (
            <button
              key={i}
              type="button"
              // `aria-pressed`: the same "which one of a row is selected" shape as `Chip`.
              aria-pressed={i === index}
              aria-label={`Bilde ${i + 1} av ${count}`}
              onClick={() => setIndex(i)}
              className="focus-visible:outline-focus flex size-6 items-center justify-center focus-visible:outline-3 focus-visible:-outline-offset-3"
            >
              <span
                className={[
                  'size-2.5 border border-current transition-colors duration-150 motion-reduce:transition-none',
                  i === index ? 'bg-current' : '',
                ].join(' ')}
              />
            </button>
          ))}
        </div>
        <p className="sr-only" role="status">
          {`Bilde ${index + 1} av ${count}${current.alt ? ': ' + current.alt : ''}`}
        </p>
      </>
    ) : null;

    return (
      <section
        ref={ref}
        aria-roledescription="karusell"
        aria-label={label}
        onKeyDown={onKeyDown}
        // The literal vh budget belongs to the whole component, not just the photo: the tick
        // row and the caption strip are `shrink-0` below, so the flex algorithm shrinks only
        // the photo box when the sum would exceed the cap.
        className={['flex max-h-[80vh] w-full flex-col gap-2 lg:max-h-[60vh]', className].join(' ')}
        {...props}
      >
        <figure className="border-border bg-surface flex min-h-0 flex-col border">
          <div className="relative aspect-[3/2] min-h-0 w-full shrink">
            <button
              type="button"
              aria-label={imageLabel}
              onClick={onImageClick}
              onPointerDown={onImagePointerDown}
              onPointerUp={onImagePointerUp}
              // `pan-y`, not `none`: the swipe only reads the horizontal delta, so vertical
              // page scroll has to keep working for a finger that lands on the photo.
              className="focus-visible:outline-focus block h-full w-full cursor-zoom-in touch-pan-y focus-visible:outline-3 focus-visible:-outline-offset-3"
            >
              <img
                src={cropUrl(current, 960, MAIN_ASPECT)}
                srcSet={candidates
                  .map((width) => `${cropUrl(current, width, MAIN_ASPECT)} ${width}w`)
                  .join(', ')}
                sizes="(min-width: 1024px) 50vw, 100vw"
                alt={current.alt ?? ''}
                loading="lazy"
                decoding="async"
                style={{ objectPosition: hotspotPosition(current) }}
                className="block h-full w-full object-cover"
              />
            </button>
            {arrowControls}
          </div>
          {current.caption || credit ? (
            <figcaption className="border-border text-fg-muted shrink-0 border-t px-3 py-2 text-sm">
              {current.caption ? <span className="block">{current.caption}</span> : null}
              {credit ? <span className="mt-0.5 block text-xs opacity-80">{credit}</span> : null}
            </figcaption>
          ) : null}
        </figure>

        {tickRow}

        {lightboxOpen ? (
          <Dialog
            size="full"
            title={label}
            headerEnd={
              <Button type="button" variant="ghost" size="sm" onClick={closeLightbox}>
                Lukk
              </Button>
            }
            onClose={closeLightbox}
            onKeyDown={onKeyDown}
          >
            <div className="relative flex min-h-0 flex-1 items-center justify-center">
              <img
                src={cropUrl(current, 1920, lightboxAspect)}
                srcSet={lightboxCandidates
                  .map((width) => `${cropUrl(current, width, lightboxAspect)} ${width}w`)
                  .join(', ')}
                sizes="100vw"
                alt={current.alt ?? ''}
                decoding="async"
                style={{ objectPosition: hotspotPosition(current) }}
                onPointerDown={onImagePointerDown}
                onPointerUp={onImagePointerUp}
                className="max-h-full max-w-full touch-pan-y object-contain"
              />
              {arrowControls}
            </div>
            {tickRow}
            {current.caption || credit ? (
              <p className="text-fg-muted shrink-0 text-center text-sm">
                {current.caption}
                {current.caption && credit ? ' — ' : null}
                {credit}
              </p>
            ) : null}
          </Dialog>
        ) : null}
      </section>
    );
  },
);

Carousel.displayName = 'Carousel';
