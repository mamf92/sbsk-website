import { type SanityImageSource } from '@sanity/image-url';
import { urlFor } from '../../sanity/sanityImageUrl';
import {
  HERO_PLACEHOLDER_FALLBACK_WIDTH,
  HERO_SANITY_WIDTHS,
  HERO_SIZES,
  heroPlaceholderSrcSet,
  heroPlaceholderUrl,
} from '../../utils/heroImage';

type HeroImageProps = {
  /** The editor's hero photo. Absent — no document, or none uploaded — falls back to the placeholder. */
  image?: SanityImageSource | null;
  /**
   * This hero is the largest thing above the fold on its own route, so it is the LCP element
   * and must not queue behind the bundle. Pass it on the route a visitor lands on.
   */
  priority?: boolean;
  className?: string;
};

/**
 * The full-bleed photo behind a hero band, in whichever modern format the browser accepts.
 *
 * The placeholder used to ship as a single 1.09MB JPEG imported from `src/assets/`, and it was
 * the LCP element on the home page: 11.6s on throttled mobile (#222). The same photo is 17.6KB
 * as AVIF at 640w. Sanity-served heroes get the same treatment through `auto=format`, which is
 * what the CDN needs in order to negotiate AVIF/WebP per request — the hero queries were the one
 * place left in the app still asking for the uploaded format verbatim.
 *
 * The widths, formats and URLs live in `src/utils/heroImage.ts`, because `index.html` names them
 * too. See its doc comment for how the placeholder derivatives are regenerated.
 */
export function HeroImage({ image, priority = false, className = '' }: HeroImageProps) {
  const imgClassName = ['h-full w-full object-cover', className].filter(Boolean).join(' ');
  // `eager`/`high` only where the caller says this is the LCP element; anything else would be
  // asking the browser to prioritise an image that is not on the critical path.
  const loading = priority ? 'eager' : 'lazy';
  const fetchPriority = priority ? 'high' : 'auto';

  if (image) {
    const sanityUrl = (width: number) =>
      urlFor(image).width(width).fit('crop').auto('format').url();

    return (
      <img
        src={sanityUrl(HERO_SANITY_WIDTHS[HERO_SANITY_WIDTHS.length - 1])}
        srcSet={HERO_SANITY_WIDTHS.map((width) => `${sanityUrl(width)} ${width}w`).join(', ')}
        sizes={HERO_SIZES}
        alt=""
        loading={loading}
        fetchPriority={fetchPriority}
        decoding="async"
        className={imgClassName}
      />
    );
  }

  // A `<picture>` rather than one `srcSet`, because format is a hard capability check the browser
  // makes on `type` — unlike width, it cannot be expressed as a descriptor. The `<img>` carries
  // the JPEG ladder, so a browser that understands neither source still gets a responsive image
  // rather than the 1500w one.
  return (
    <picture>
      <source type="image/avif" srcSet={heroPlaceholderSrcSet('avif')} sizes={HERO_SIZES} />
      <source type="image/webp" srcSet={heroPlaceholderSrcSet('webp')} sizes={HERO_SIZES} />
      <img
        src={heroPlaceholderUrl(HERO_PLACEHOLDER_FALLBACK_WIDTH, 'jpg')}
        srcSet={heroPlaceholderSrcSet('jpg')}
        sizes={HERO_SIZES}
        alt=""
        loading={loading}
        fetchPriority={fetchPriority}
        decoding="async"
        className={imgClassName}
      />
    </picture>
  );
}

HeroImage.displayName = 'HeroImage';
