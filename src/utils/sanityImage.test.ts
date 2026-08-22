import { describe, expect, it } from 'vitest';
import { MAX_ASPECT, MIN_ASPECT, clampAspect, hotspotPosition } from './sanityImage';

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
