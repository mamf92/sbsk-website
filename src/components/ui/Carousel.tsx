import * as React from 'react';
import { Button } from './Buttons';
import { cropUrl, hotspotPosition } from '../../utils/sanityImage';
import type { SanityImageValue } from './SanityImage';

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
const THUMBNAILS_PER_PAGE = 3;

function clampIndex(index: number, length: number) {
  return Math.min(Math.max(index, 0), Math.max(length - 1, 0));
}

export const Carousel = React.forwardRef<HTMLElement, CarouselProps>(
  ({ className = '', images, initialIndex = 0, label = 'Bildekarusell', ...props }, ref) => {
    const [index, setIndex] = React.useState(() => clampIndex(initialIndex, images.length));
    const count = images.length;

    if (count === 0) return null;

    const current = images[index];
    const hasControls = count > 1;
    const prev = () => setIndex((i) => (i - 1 + count) % count);
    const next = () => setIndex((i) => (i + 1) % count);

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

    const dimensions = current.asset?.metadata?.dimensions;
    const candidates = [480, 720, 960]
      .map((width) => (dimensions?.width ? Math.min(width, dimensions.width) : width))
      .filter((width, i, all) => all.indexOf(width) === i);

    const credit =
      current.imageSourceName && current.imageSourceUrl ? (
        <a
          href={current.imageSourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Foto: {current.imageSourceName}
        </a>
      ) : null;

    // Paginated in groups of three rather than a window that slides on every step: the row only
    // moves on a page turn, so the tile a reader is reaching for never shifts out from under the
    // pointer. A photo count not divisible by three just has a short last page.
    const page = Math.floor(index / THUMBNAILS_PER_PAGE);
    const pageStart = page * THUMBNAILS_PER_PAGE;
    const thumbnails = images
      .slice(pageStart, pageStart + THUMBNAILS_PER_PAGE)
      .map((image, i) => ({ image, index: pageStart + i }));

    return (
      <section
        ref={ref}
        aria-roledescription="karusell"
        aria-label={label}
        onKeyDown={onKeyDown}
        // The literal vh budget belongs to the whole component, not just the photo: the
        // thumbnail/tick row and the caption strip are `shrink-0` below, so the flex algorithm
        // shrinks only the photo box when the sum would exceed the cap.
        className={['flex max-h-[80vh] w-full flex-col gap-2 lg:max-h-[60vh]', className].join(' ')}
        {...props}
      >
        <figure className="flex min-h-0 flex-col border border-black">
          <div className="relative aspect-[3/2] min-h-0 w-full shrink">
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
            {hasControls ? (
              <>
                <span className="absolute top-1/2 left-2 -translate-y-1/2">
                  <Button
                    type="button"
                    variant="tertiary"
                    size="sm"
                    icon="left"
                    aria-label="Forrige bilde"
                    onClick={prev}
                  />
                </span>
                <span className="absolute top-1/2 right-2 -translate-y-1/2">
                  <Button
                    type="button"
                    variant="tertiary"
                    size="sm"
                    icon="right"
                    aria-label="Neste bilde"
                    onClick={next}
                  />
                </span>
              </>
            ) : null}
          </div>
          {current.caption || credit ? (
            <figcaption className="shrink-0 border-t border-black bg-current/10 px-3 py-2 text-sm">
              {current.caption ? <span className="block">{current.caption}</span> : null}
              {credit ? <span className="mt-0.5 block text-xs opacity-80">{credit}</span> : null}
            </figcaption>
          ) : null}
        </figure>

        {hasControls ? (
          <>
            {/* Desktop: a paginated row of three thumbnails. */}
            <div className="hidden shrink-0 grid-cols-3 gap-2 lg:grid">
              {thumbnails.map(({ image, index: i }) => (
                <button
                  key={i}
                  type="button"
                  aria-current={i === index}
                  aria-label={image.alt || `Bilde ${i + 1}`}
                  onClick={() => setIndex(i)}
                  className={[
                    'focus-visible:outline-focus-ring h-16 w-full focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2',
                    i === index ? 'border-orange border-2' : 'border-2 border-black',
                  ].join(' ')}
                >
                  <img
                    src={cropUrl(image, 320, 5 / 2)}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    style={{ objectPosition: hotspotPosition(image) }}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
            {/* Mobile/tablet: square ticks — the brand's zero-radius rule rules out a circular
                dot, so this keeps the idea (position indicator) in the house style, and unlike
                Instagram's own dots these are real, tappable, labelled controls. */}
            <div className="flex shrink-0 flex-wrap items-center justify-center gap-1 lg:hidden">
              {images.map((_image, i) => (
                <button
                  key={i}
                  type="button"
                  aria-current={i === index}
                  aria-label={`Bilde ${i + 1} av ${count}`}
                  onClick={() => setIndex(i)}
                  className="focus-visible:outline-focus-ring flex size-6 items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2"
                >
                  <span
                    className={[
                      'size-2.5 border border-current',
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
        ) : null}
      </section>
    );
  },
);

Carousel.displayName = 'Carousel';
