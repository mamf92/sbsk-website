import * as React from 'react';
import { urlFor } from '../../sanity/sanityImageUrl';
import { clampAspect, MAX_IMAGE_HEIGHT } from '../../utils/sanityImage';
import type { SanityImageSource } from '@sanity/asset-utils';

type Dimensions = { width?: number; height?: number; aspectRatio?: number };

export type SanityImageValue = SanityImageSource & {
  alt?: string;
  caption?: string;
  imageSourceName?: string;
  imageSourceUrl?: string;
  hotspot?: { x?: number; y?: number };
  asset?: { metadata?: { dimensions?: Dimensions } };
};

type SanityImageProps = Omit<React.HTMLAttributes<HTMLElement>, 'children'> & {
  value: SanityImageValue;
};

// `fit('crop')` is what makes @sanity/image-url honour the editor's hotspot, and it only does so
// when both width and height are given — which is why every URL below carries both. When the
// clamp leaves the ratio untouched the crop is a no-op and the hotspot simply does nothing.
function cropUrl(value: SanityImageValue, width: number, aspect: number) {
  return urlFor(value)
    .width(width)
    .height(Math.round(width / aspect))
    .fit('crop')
    .auto('format')
    .quality(80)
    .url();
}

export const SanityImage = React.forwardRef<HTMLElement, SanityImageProps>(
  ({ className = '', value, ...props }, ref) => {
    const dimensions = value.asset?.metadata?.dimensions;
    const naturalAspect =
      dimensions?.aspectRatio ??
      (dimensions?.width && dimensions?.height ? dimensions.width / dimensions.height : undefined);

    const aspect = clampAspect(naturalAspect);
    const displayWidth = Math.round(aspect * MAX_IMAGE_HEIGHT);

    // 1x/1.5x/2x of the rendered size, never asking the CDN to upscale past what was uploaded.
    const candidates = [displayWidth, Math.round(displayWidth * 1.5), displayWidth * 2]
      .map((width) => (dimensions?.width ? Math.min(width, dimensions.width) : width))
      .filter((width, index, all) => all.indexOf(width) === index);

    const credit =
      value.imageSourceName && value.imageSourceUrl ? (
        <a
          href={value.imageSourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Foto: {value.imageSourceName}
        </a>
      ) : null;

    return (
      // A miniature `Card`: a framed photo, a hard rule, and (when there's something to say) a
      // tinted strip below it — the same photo→rule→panel shape `Card` itself uses, one level
      // down. The frame lives on the figure rather than the `<img>` so the photo and its caption
      // read as one bordered insert, not a bare image with loose text beneath it. Left-anchored
      // rather than centered: `max-width` still caps the box at the clamped, height-capped size,
      // but without `mx-auto` it sits at the column's own margin, the way a photo sits in a
      // printed column, rather than floating as a box in the middle of a much wider panel.
      <figure
        ref={ref}
        style={{ maxWidth: `${displayWidth}px` }}
        className={['w-full border border-black', className].join(' ')}
        {...props}
      >
        <img
          src={cropUrl(value, displayWidth, aspect)}
          srcSet={candidates
            .map((width) => `${cropUrl(value, width, aspect)} ${width}w`)
            .join(', ')}
          sizes={`(max-width: ${displayWidth}px) 100vw, ${displayWidth}px`}
          // The intrinsic attributes are what reserve the box before the bytes land; without
          // them every post image shifts the text under it as it loads.
          width={displayWidth}
          height={Math.round(displayWidth / aspect)}
          alt={value.alt ?? ''}
          loading="lazy"
          decoding="async"
          // `border-0` beats `.sbsk-rt img`'s base-layer hairline (see index.css) — the frame
          // now belongs to the figure, so the image itself must not draw a second one.
          className="block h-auto w-full border-0"
        />
        {value.caption || credit ? (
          // `bg-current/10`: a tint of whatever text colour this is already sitting in — white
          // inside a `nyheter` panel, `darkestblue` everywhere else — so the strip is always a
          // subtle shade of its own panel with no category prop and no dark: variant, and never
          // a contrast regression (it only pushes an already-passing ratio further from the
          // line). `border-t` is the exact rule `Card` draws between its own header and panel.
          <figcaption className="border-t border-black bg-current/10 px-3 py-2 text-sm">
            {value.caption ? <span className="block">{value.caption}</span> : null}
            {credit ? <span className="mt-0.5 block text-xs opacity-80">{credit}</span> : null}
          </figcaption>
        ) : null}
      </figure>
    );
  },
);

SanityImage.displayName = 'SanityImage';
