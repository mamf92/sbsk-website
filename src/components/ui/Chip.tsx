import * as React from 'react';

export type ChipCategory =
  'neutral' | 'nyheter' | 'spillkveld' | 'arrangementer' | 'turnering' | 'annet';

type ChipProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  category?: ChipCategory;
  active?: boolean;
};

// Square, bordered filter pill for the Kalender and Innlegg lists. Body font, not heading —
// that is what separates it from a small Button. `lift-chip` (src/index.css) carries both the
// colour swap and the press, so no `transition-*` utility may join it here.
const base =
  'inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-none ' +
  'border px-4 py-2 font-body text-xs font-bold capitalize lift-chip ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ' +
  'focus-visible:outline-focus-ring ';

// Unselected chips are one shared outline; only the selected fill is category-coded. The
// library has no dark-mode chip, so the unselected surface goes transparent rather than
// staying white against `dark:bg-darkestblue`.
const inactive =
  'border-gray-neutral bg-white text-gray-500 hover:border-darkestblue ' +
  'dark:bg-transparent dark:text-white dark:hover:border-orange';

// Each selected fill matches the header fill its category's cards use, so a filter looks
// like what it filters to. `spillkveld` and `turnering` land on the same orange, as do
// `arrangementer` and `annet` — the same aliasing `Card` applies, kept as separate keys so
// the two pairs can diverge without a rename.
const active = {
  neutral: 'border-darkblue bg-darkorange text-white',
  nyheter: 'border-darkblue bg-category-nyheter text-white',
  spillkveld: 'border-orange bg-category-spillkveld text-darkestblue',
  arrangementer: 'border-darkorange bg-category-arrangementer text-white',
  turnering: 'border-orange bg-category-turnering text-darkestblue',
  annet: 'border-darkorange bg-category-annet text-white',
} as const;

export const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  ({ className = '', category = 'neutral', active: isActive = false, children, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      aria-pressed={isActive}
      className={[base, isActive ? active[category] : inactive, className].join(' ')}
      {...props}
    >
      {children}
    </button>
  ),
);

Chip.displayName = 'Chip';
