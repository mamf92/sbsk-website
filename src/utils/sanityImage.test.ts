import { describe, expect, it, vi } from 'vitest';
import { MAX_ASPECT, MIN_ASPECT, clampAspect, cropUrl, hotspotPosition } from './sanityImage';

// Mirrors the mock shape in `SanityImage.test.tsx` and `Carousel.test.tsx` — both share this
// module's `cropUrl`, so all three assert against the same recorded width/height.
vi.mock('../sanity/sanityImageUrl', () => {
  type Params = { w?: number; h?: number };
  const chain = (params: Params) => ({
    width: (w: number) => chain({ ...params, w }),
    height: (h: number) => chain({ ...params, h }),
    fit: () => chain(params),
    auto: () => chain(params),
    quality: () => chain(params),
    url: () => `https://cdn.test/img?w=${params.w}&h=${params.h}`,
  });
  return { urlFor: () => chain({}) };
});

describe('clampAspect', () => {
  it('lifts a portrait phone photo up to the 4:5 floor', () => {
    expect(clampAspect(0.75)).toBe(MIN_ASPECT);
  });

  it('leaves a ratio inside the band untouched', () => {
    expect(clampAspect(4 / 3)).toBe(4 / 3);
  });

  it('trims a panorama down to the 16:9 ceiling', () => {
    expect(clampAspect(2.5)).toBe(MAX_ASPECT);
  });

  it('falls back to a sane ratio when dimensions are missing or nonsense', () => {
    for (const bad of [undefined, 0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      const result = clampAspect(bad);
      expect(result).toBeGreaterThanOrEqual(MIN_ASPECT);
      expect(result).toBeLessThanOrEqual(MAX_ASPECT);
    }
  });
});

describe('hotspotPosition', () => {
  it('turns a fractional hotspot into a CSS object-position', () => {
    expect(hotspotPosition({ hotspot: { x: 0.3, y: 0.7 } })).toBe('30.00% 70.00%');
  });

  it('returns undefined when there is no hotspot to honour', () => {
    expect(hotspotPosition({})).toBeUndefined();
    expect(hotspotPosition({ hotspot: {} })).toBeUndefined();
  });
});

describe('cropUrl', () => {
  it('asks the CDN for both a width and a height, so the hotspot is honoured', () => {
    // `fit('crop')` only respects the editor's hotspot when both dimensions are given —
    // omitting either one silently falls back to a centre crop.
    expect(cropUrl({}, 400, 2)).toBe('https://cdn.test/img?w=400&h=200');
  });

  it('rounds a non-integer height', () => {
    expect(cropUrl({}, 358, 4 / 5)).toBe('https://cdn.test/img?w=358&h=448');
  });
});
