/**
 * The button recipe, kept apart from `<Button>` so a link that navigates (an `<a>`, a router
 * `Link`) can look like a button without being one. `GameCard` and `HeroLinks` use it that way.
 *
 * Redesign 2026 (docs/DESIGN_LANGUAGE.md): square corners, no lift, no offset shadow. Hover is
 * a colour change only. Four variants, two sizes:
 *
 * - `primary`   orange fill — the one main action on a screen
 * - `secondary` navy outline (light outline on dark surfaces) — the alternative
 * - `ghost`     no fill or border — Avbryt, Lukk, low-stakes actions
 * - `danger`    red fill — destructive actions in the portals
 */

const base =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none border-2 ' +
  'font-body font-semibold transition-colors duration-150 motion-reduce:transition-none ' +
  'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus ' +
  // A disabled button reads as unavailable in every variant. A *loading* button is disabled
  // too, but keeps its colours: it is busy, not unavailable.
  'disabled:cursor-not-allowed aria-busy:cursor-progress ' +
  'disabled:not-aria-busy:border-transparent disabled:not-aria-busy:bg-surface-muted ' +
  'disabled:not-aria-busy:text-fg-muted';

// `not-disabled:hover:` because `:hover` still matches a disabled element.
const variants = {
  primary: 'border-transparent bg-primary text-on-primary not-disabled:hover:bg-primary-hover',
  secondary:
    'border-secondary bg-transparent text-secondary ' +
    'not-disabled:hover:bg-secondary not-disabled:hover:text-on-secondary',
  ghost: 'border-transparent bg-transparent text-fg not-disabled:hover:bg-surface-muted',
  danger: 'border-transparent bg-danger text-on-danger not-disabled:hover:bg-danger-hover',
} as const;

// 44px is the comfortable touch target and the default; 36px is for dense rows only.
const sizes = {
  md: 'min-h-11 px-5 text-base',
  sm: 'min-h-9 px-3 text-sm',
} as const;

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;

export const buttonVariants = Object.keys(variants) as ButtonVariant[];
export const buttonSizes = Object.keys(sizes) as ButtonSize[];

export function buttonClasses({
  variant = 'primary',
  size = 'md',
  className = '',
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return [base, variants[variant], sizes[size], className].filter(Boolean).join(' ');
}
