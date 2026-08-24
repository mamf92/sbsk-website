import { urlFor } from '../sanity/sanityImageUrl';
import type { SanityImageSource } from '@sanity/asset-utils';

// Phone cameras shoot 3:4 portrait and the old renderer force-cropped every one of them to a
// 2:1 letterbox, which takes the heads off. Instead of imposing one ratio we clamp the image's
// own ratio into a band: anything taller than 4:5 is trimmed to 4:5, anything wider than 16:9
// is trimmed to 16:9, and everything between renders exactly as shot. A 3:4 photo loses ~6%
// rather than half its height. This is the rule Instagram uses, for the same reason.
export const MIN_ASPECT = 4 / 5;
export const MAX_ASPECT = 16 / 9;

// The cap that keeps a photo from owning the whole card on desktop. Height rather than width,
// because height is what a portrait shot runs away with. At 448 the widest permitted ratio is
// 796px across, comfortably inside the ~992px panel, so this single number governs every
// desktop size and `w-full` governs on mobile. It feeds arithmetic, so it is a constant here
// rather than a `@theme` token — a CSS variable cannot be multiplied by an aspect ratio.
export const MAX_IMAGE_HEIGHT = 448;

// Without `metadata.dimensions` we cannot know the shape; 3:2 is the least surprising guess and
// still lands inside the band. The GROQ projection in `queryHelpers/posts.ts` always supplies
// dimensions, so this only covers a partially-written document.
const FALLBACK_ASPECT = 3 / 2;

export function clampAspect(ratio: number | undefined): number {
  if (!ratio || !Number.isFinite(ratio) || ratio <= 0) return FALLBACK_ASPECT;
  return Math.min(Math.max(ratio, MIN_ASPECT), MAX_ASPECT);
}

// The CDN honours the hotspot when it crops, but a box whose shape is decided at runtime — the
// card header, which stretches to whatever the title needs — is cropped a second time by CSS.
// Handing `object-position` the same hotspot keeps both crops pointed at the same subject.
export function hotspotPosition(value: {
  hotspot?: { x?: number; y?: number };
}): string | undefined {
  const { x, y } = value.hotspot ?? {};
  if (typeof x !== 'number' || typeof y !== 'number') return undefined;
  return `${(x * 100).toFixed(2)}% ${(y * 100).toFixed(2)}%`;
}

// Shared by `SanityImage` and `Carousel` — both crop through @sanity/image-url the same way.
// `fit('crop')` is what makes the library honour the editor's hotspot, and it only does so when
// both width and height are given, which is why every caller here supplies both.
export function cropUrl(value: SanityImageSource, width: number, aspect: number) {
  return urlFor(value)
    .width(width)
    .height(Math.round(width / aspect))
    .fit('crop')
    .auto('format')
    .quality(80)
    .url();
}
