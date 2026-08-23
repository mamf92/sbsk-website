import * as React from 'react';

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
};

type SegmentedProps<T extends string> = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'onChange' | 'children'
> & {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /**
   * Names the group for assistive tech. A segmented control has no visible label — the
   * segments read as three unrelated buttons without it — so this is required rather than
   * optional.
   */
  label: string;
  size?: 'sm' | 'md';
  /**
   * React 19 passes `ref` as an ordinary prop, which is what lets this stay a generic
   * function. `forwardRef` erases the type parameter unless the result is cast back, and the
   * cast costs more than it buys here.
   */
  ref?: React.Ref<HTMLDivElement>;
};

// The group owns the outer hairline and each segment owns only the divider to its left, so
// the border stays 1px where two segments meet instead of doubling into 2px.
const group = 'inline-flex rounded-none border border-black dark:border-white';

// `segment` (src/index.css) carries the colour swap and the selected segment's inset shadow
// on one `transition`, so no `transition-*` utility may join it here. Joined segments do not
// travel — see the utility's own comment, and "Who lifts" in docs/DESIGN_LANGUAGE.md.
//
// The focus ring points inward — `-outline-offset-2` — where every other control in the
// system points outward. A group is `inline-flex` with no gaps, so an outward ring on a
// middle segment is drawn underneath its neighbours and only its top and bottom edges survive.
const segmentBase =
  'segment font-heading cursor-pointer whitespace-nowrap rounded-none font-bold ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 ' +
  'focus-visible:outline-focus-ring ';

// Height rather than padding-driven, so a segment stands exactly as tall as `Button` at the
// same size name — `sm` onto `h-9`, `md` onto `h-11` — instead of a shorter, independent scale
// that happened to land close by.
const sizes = {
  sm: 'h-9 px-3 text-xs',
  md: 'h-11 px-4 text-xs',
} as const;

// Orange because that is the brand's "this one is on", not because of the category coding.
// It lands on the same value as `Chip`'s selected `spillkveld` fill, but reaches it through
// the flat `orange` token rather than `category-spillkveld` — so the two look related today
// and re-theming a content category never silently moves a view switcher.
//
// `surface-light` rather than letting the theme pick: the fill under this shadow is orange in
// both modes, and white-on-orange measures 2.18:1 while darkestblue-on-orange measures 7.64:1.
const selected = 'bg-orange text-darkestblue surface-light';

// The hover tint reads off the same two ink tokens as the group's own border — `black` and
// `white` — rather than a Tailwind default grey, which nothing else in the button/control
// system carries and which read as a foreign, off-brand hover.
const unselected =
  'text-darkestblue bg-white hover:bg-black/5 ' +
  'dark:bg-transparent dark:text-white dark:hover:bg-white/10';

/**
 * A joined button group for one small mutually-exclusive choice — the calendar's
 * Kommende / Tidligere / Alle switcher is the shape it was built for.
 *
 * **When to reach for this rather than `Chip` or `Select`.** `Chip` reads as a filter:
 * multi-select, additive, and it says nothing about the options you did not pick. `Segmented`
 * says the opposite — these are all the options, exactly one is on. `Select` covers the same
 * single-choice job but hides the options until opened, so it wins as soon as there are more
 * than about four, or the labels are long enough that the group stops fitting on a line at
 * 320px. Sorting is that case on both list pages and uses `Select`; view switching is not
 * and uses this.
 *
 * `role="group"` of `aria-pressed` buttons rather than `radiogroup` of radios: every segment
 * stays in the tab order and is reached with Tab, which is what the buttons here already did
 * before the component moved out of `CalendarSection`. Radios would swap that for arrow-key
 * roving focus — defensible, but a different page to operate, and not a change to make while
 * lifting a component.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  size = 'md',
  className = '',
  ref,
  ...props
}: SegmentedProps<T>) {
  return (
    <div
      ref={ref}
      role="group"
      aria-label={label}
      className={[group, className].join(' ')}
      {...props}
    >
      {options.map((option, index) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={[
            segmentBase,
            sizes[size],
            index > 0 ? 'border-l border-black dark:border-white' : '',
            value === option.value ? selected : unselected,
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

Segmented.displayName = 'Segmented';
