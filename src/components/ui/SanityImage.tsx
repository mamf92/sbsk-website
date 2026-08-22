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
          {value.imageSourceName}
        </a>
      ) : null;

    return (
      <figure
        ref={ref}
        // The cap is expressed as a max-width derived from the ratio rather than a max-height,
        // so the figure box shrinks with the image instead of leaving the caption stranded
        // below a letterboxed gap.
        style={{ maxWidth: `${displayWidth}px` }}
        className={['mx-auto w-full', className].join(' ')}
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
          className="block h-auto w-full border border-black"
        />
        {value.caption || credit ? (
          // A caption under the photo rather than a translucent slab over it: it reads like a
          // news article, and it inherits the panel's own foreground colour, so it stays legible
          // on all three panel tones instead of relying on an unmeasurable scrim.
          <figcaption className="mt-2 text-sm">
            {value.caption}
            {value.caption && credit ? ' — ' : null}
            {credit}
          </figcaption>
        ) : null}
      </figure>
    );
  },
);

SanityImage.displayName = 'SanityImage';
