import { describe, expect, it } from 'vitest';
import { buttonClasses, buttonSizes, buttonVariants } from './buttonClasses';

describe('buttonClasses', () => {
  it('always draws the focus ring on the focus token', () => {
    for (const variant of buttonVariants) {
      expect(buttonClasses({ variant }).split(/\s+/)).toContain('focus-visible:outline-focus');
    }
  });

  it('has exactly the four redesign variants and two sizes', () => {
    expect(buttonVariants).toEqual(['primary', 'secondary', 'ghost', 'danger']);
    expect(buttonSizes).toEqual(['md', 'sm']);
  });

  it('produces a distinct class list per variant and per size', () => {
    const byVariant = new Set(buttonVariants.map((variant) => buttonClasses({ variant })));
    const bySize = new Set(buttonSizes.map((size) => buttonClasses({ size })));
    expect(byVariant.size).toBe(buttonVariants.length);
    expect(bySize.size).toBe(buttonSizes.length);
  });

  it('never lifts or casts a hard shadow — hover is colour only', () => {
    for (const variant of buttonVariants) {
      const classes = buttonClasses({ variant });
      expect(classes).not.toMatch(/\blift\b|shadow-[123]\b|translate/);
      expect(classes).not.toMatch(/rounded-(?!none)/);
    }
  });

  it('keeps a 44px default touch target', () => {
    expect(buttonClasses().split(/\s+/)).toContain('min-h-11');
  });

  it('appends the caller className last, so it can override', () => {
    expect(buttonClasses({ className: 'w-full' }).endsWith(' w-full')).toBe(true);
  });

  it('keeps whitespace at every segment boundary', () => {
    for (const variant of buttonVariants) {
      for (const size of buttonSizes) {
        const tokens = buttonClasses({ variant, size, className: 'w-full' }).split(/\s+/);
        for (const token of tokens) expect(token).not.toMatch(/[a-z0-9](min-h|px|border|bg)-/);
      }
    }
  });
});
