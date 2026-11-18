/**
 * The one hover every icon-only control shares: a fixed square that lifts up-left onto the hard
 * offset shadow, with the focus ring on the same square. Before this the burger had it, the
 * theme toggle had it only because it was a text `Button` with an icon beside the text, and the
 * add-to-calendar button stretched to the full height of its card, so its hover lifted a whole
 * strip of the card rather than a button.
 *
 * `NavMenuButton` composes `iconButtonClasses` rather than `IconButton`, because its bars are
 * an animation, not an icon from the map.
 */
const base =
  'inline-flex size-icon-button flex-none cursor-pointer items-center justify-center ' +
  'rounded-none border-0 lift ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ' +
  'focus-visible:outline-focus-ring';

const variants = {
  // No fill: draws in the surface's own text colour, and the shadow is what shows the box.
  ghost: 'bg-transparent text-current',
  // The header's filled square, the same fills as `Button`'s `toggle` (see buttonClasses.ts).
  toggle:
    'bg-darkestblue text-white not-disabled:hover:bg-darkblue ' +
    'dark:bg-orange dark:text-darkblue dark:not-disabled:hover:bg-darkorange',
} as const;

export type IconButtonVariant = keyof typeof variants;

export function iconButtonClasses({
  variant = 'ghost',
  className = '',
}: { variant?: IconButtonVariant; className?: string } = {}) {
  return [base, variants[variant], className].filter(Boolean).join(' ');
}
