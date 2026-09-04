// The URL side of `HeroImage`, split out the way `sanityImage.ts` is split out of `SanityImage`:
// `index.html` has to name these files too, so the ladder cannot live inside a component module.

/**
 * The widths `public/images/hero/` was pre-encoded at. 1500 is the source photo's own width —
 * nothing upscales past it.
 */
export const HERO_PLACEHOLDER_WIDTHS = [640, 960, 1280, 1500] as const;

/** The width the plain `<img>` names as its `src`, for a browser that ignores `srcSet`. */
export const HERO_PLACEHOLDER_FALLBACK_WIDTH = 1280;

/** Widths asked of the Sanity CDN. Same ladder, so both paths behave the same at a given screen. */
export const HERO_SANITY_WIDTHS = [640, 960, 1280, 1440] as const;

/** Every hero band is full-bleed, so the rendered width is always the viewport width. */
export const HERO_SIZES = '100vw';

export type HeroImageFormat = 'avif' | 'webp' | 'jpg';

/**
 * `public/`, not an `import` out of `src/assets/`, for one reason: `index.html` preloads the
 * placeholder (see the `<link rel="preload">` there), and a preload has to name a URL that is
 * knowable before the bundle is hashed. The cost is that these files are not fingerprinted, so a
 * replaced photo is served stale for up to the Pages cache TTL — ten minutes. See "Caching" in
 * docs/HOSTING.md.
 *
 * The twelve files under `public/images/hero/` are derived from
 * `src/assets/images/hero-placeholder.jpg`, which is kept as the source and is no longer imported
 * by anything. There is no build step for them and no image dependency in `package.json` — they
 * are encoded once, by hand, and committed:
 *
 *     npx --yes sharp-cli@5 -i src/assets/images/hero-placeholder.jpg \
 *       -o public/images/hero --format avif --quality 50 resize <width>
 *
 * once per width in `HERO_PLACEHOLDER_WIDTHS`, and again at `--format webp --quality 72` and
 * `--format jpeg --quality 74`, named `hero-<width>.<ext>`. Change the ladder and the
 * `<link rel="preload">` in `index.html` has to change with it — `HeroImage.test.tsx` pins the
 * exact URLs so the two cannot drift apart silently.
 */
export function heroPlaceholderUrl(width: number, format: HeroImageFormat) {
  return `${import.meta.env.BASE_URL}images/hero/hero-${width}.${format}`;
}

export function heroPlaceholderSrcSet(format: HeroImageFormat) {
  return HERO_PLACEHOLDER_WIDTHS.map(
    (width) => `${heroPlaceholderUrl(width, format)} ${width}w`,
  ).join(', ');
}
