import { describe, expect, it } from 'vitest';
import { buttonClasses } from './buttonClasses';

describe('buttonClasses', () => {
  // The reason this module exists: GameCard's three anchors carried `lift` and no focus ring.
  // Anything wearing the button recipe gets the affordance whether it remembers to or not.
  it('always draws the focus ring, on the semantic token', () => {
    const variants = ['primary', 'secondary', 'tertiary', 'toggle', 'outline', 'disabled'] as const;
    for (const variant of variants) {
      expect(buttonClasses({ variant })).toContain('focus-visible:outline-focus-ring');
    }
  });

  it('lifts every pressable variant, and never the disabled one', () => {
    expect(buttonClasses({ variant: 'primary' })).toMatch(/\blift\b/);
    expect(buttonClasses({ variant: 'outline' })).toMatch(/\blift\b/);
    expect(buttonClasses({ variant: 'disabled' })).not.toMatch(/\blift\b/);
  });

  // `lift` owns `transition` outright — the last transition-property in the cascade wins and
  // would silently drop the other half. The same rule the per-component tests pin.
  it('never pairs a lift with a transition utility', () => {
    for (const variant of ['primary', 'secondary', 'tertiary', 'toggle', 'outline'] as const) {
      expect(buttonClasses({ variant })).not.toMatch(/\btransition/);
    }
  });

  it('gives the disabled variant a bare colour transition instead', () => {
    expect(buttonClasses({ variant: 'disabled' })).toContain('transition-colors');
  });

  it('produces a distinct class list per variant and per size', () => {
    const variants = ['primary', 'secondary', 'tertiary', 'toggle', 'outline', 'disabled'] as const;
    expect(new Set(variants.map((variant) => buttonClasses({ variant }))).size).toBe(
      variants.length,
    );

    const sizes = ['xs', 'sm', 'md', 'lg'] as const;
    expect(new Set(sizes.map((size) => buttonClasses({ size }))).size).toBe(sizes.length);
  });

  it('appends the caller className last, so it can override', () => {
    expect(buttonClasses({ className: 'w-full' }).endsWith('w-full')).toBe(true);
  });

  it('defaults to primary at md, and needs no arguments at all', () => {
    expect(buttonClasses()).toBe(buttonClasses({ variant: 'primary', size: 'md' }));
  });

  // `w-5fill-current` shipped once because a concatenated string lost its space at a segment
  // boundary. Whether the result is a *real* class is `src/test/tailwindClasses.test.ts`'s job,
  // repo-wide; what this pins is the seam itself — that each segment still contributes its own
  // first and last token rather than fusing with its neighbour.
  it('keeps whitespace at every segment boundary', () => {
    const tokens = buttonClasses({ variant: 'outline', size: 'lg', className: 'w-full' }).split(
      /\s+/,
    );

    expect(tokens).toContain('inline-flex'); // first token of `base`
    expect(tokens).toContain('border'); // first token of the variant
    expect(tokens).toContain('lift'); // the whole of `motion`
    expect(tokens).toContain('h-12'); // first token of the size
    expect(tokens).toContain('w-full'); // the caller's own
  });
});
