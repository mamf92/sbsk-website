import * as React from 'react';

export type ChipCategory =
  | 'neutral'
  | 'nyheter'
  | 'spillkveld'
  | 'arrangementer'
  | 'turnering'
  | 'annet'
  | 'spillkveldKalender';

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

// Resting outline is shared, but hover previews the category's own selected fill as a light
// tint — so which card colour a chip filters to is visible before it is ever pressed, not
// only after (#203). `neutral` ("Alle") represents no single card colour and keeps the plain
// border-only hover it always had. The tint is light enough that hover never reads as
// selected, and `gray-500` text stays well clear of AA over it (`--color-category-*` at 10%
// opacity moves the background a few percent off white at most).
const inactive = {
  neutral:
    'border-gray-neutral bg-white text-gray-500 hover:border-darkestblue ' +
    'dark:bg-transparent dark:text-white dark:hover:border-orange',
  nyheter:
    'border-gray-neutral bg-white text-gray-500 hover:border-darkblue hover:bg-category-nyheter/10 ' +
    'dark:bg-transparent dark:text-white dark:hover:border-orange',
  spillkveld:
    'border-gray-neutral bg-white text-gray-500 hover:border-orange hover:bg-category-spillkveld/10 ' +
    'dark:bg-transparent dark:text-white dark:hover:border-orange',
  arrangementer:
    'border-gray-neutral bg-white text-gray-500 hover:border-darkorange hover:bg-category-arrangementer/10 ' +
    'dark:bg-transparent dark:text-white dark:hover:border-orange',
  turnering:
    'border-gray-neutral bg-white text-gray-500 hover:border-orange hover:bg-category-turnering/10 ' +
    'dark:bg-transparent dark:text-white dark:hover:border-orange',
  annet:
    'border-gray-neutral bg-white text-gray-500 hover:border-darkorange hover:bg-category-annet/10 ' +
    'dark:bg-transparent dark:text-white dark:hover:border-orange',
  spillkveldKalender:
    'border-gray-neutral bg-white text-gray-500 hover:border-darkblue ' +
    'hover:bg-category-spillkveld-kalender/10 dark:bg-transparent dark:text-white dark:hover:border-orange',
} as const;

// Each selected fill matches the header fill its category's cards use, so a filter looks
// like what it filters to. `spillkveld` and `turnering` land on the same orange, as do
// `arrangementer` and `annet` — the same aliasing `Card` applies, kept as separate keys so
// the two pairs can diverge without a rename. `spillkveldKalender` is a second, separate key
// for the same reason: the calendar's own spillkveld cards stay navy rather than following
// the feed's orange `spillkveld` (#203) — see `--color-category-spillkveld-kalender`.
const active = {
  neutral: 'border-darkblue bg-darkorange text-darkestblue',
  nyheter: 'border-darkblue bg-category-nyheter text-white',
  spillkveld: 'border-orange bg-category-spillkveld text-darkestblue',
  arrangementer: 'border-darkorange bg-category-arrangementer text-darkestblue',
  turnering: 'border-orange bg-category-turnering text-darkestblue',
  annet: 'border-darkorange bg-category-annet text-darkestblue',
  spillkveldKalender: 'border-darkblue bg-category-spillkveld-kalender text-white',
} as const;

export const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  ({ className = '', category = 'neutral', active: isActive = false, children, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      aria-pressed={isActive}
      className={[base, isActive ? active[category] : inactive[category], className].join(' ')}
      {...props}
    >
      {children}
    </button>
  ),
);

Chip.displayName = 'Chip';
