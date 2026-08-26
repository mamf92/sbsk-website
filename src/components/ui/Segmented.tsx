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

// No container border and no shared `border-l` divider between segments — a bordered box,
// sized to match `Button` (`h-9`/`h-11`) rather than the `Chip` row it sits beside, was the
// "asymmetrical top-left border" and the off sizing reported against the filter chips next to
// it (#203). `gap-1` keeps the segments visually joined without a hairline between them.
const group = 'inline-flex gap-1';

// Reuses the nav bar's own underline-tab language (`navLinkClasses` in `Link.tsx`) instead of
// a bordered fill: an `after:` rule that wipes in on hover and stays put once selected, so this
// reads as the same kind of control as everything else in the library rather than a one-off.
// `font-body`, not `font-heading`, and sized to `Chip`'s own `px-4 py-2 text-xs font-bold` —
// this sits beside a chip row, not inside the header nav.
const segmentBase =
  'relative cursor-pointer font-body font-bold whitespace-nowrap capitalize ' +
  'after:absolute after:inset-x-4 after:bottom-0 after:h-0.5 after:origin-left ' +
  'after:scale-x-0 after:bg-orange after:transition-transform ' +
  'after:duration-(--duration-base) after:ease-out hover:after:scale-x-100 ' +
  'transition-colors duration-(--duration-fast) ease-standard ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ' +
  'focus-visible:outline-focus-ring ';

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-xs',
} as const;

// `darkestorange`, not `orange` — `orange` text on the control's white surface measures 2.18:1,
// well under the 4.5:1 AA body text needs. `darkestorange` clears it at 4.51:1, the tone
// `docs/DESIGN_LANGUAGE.md`'s "Field state" table reaches for whenever orange-family text has
// to sit directly on white. Dark mode is unaffected — orange on `darkestblue` already clears AA.
const selected = 'text-darkestorange after:scale-x-100 dark:text-orange';

const unselected =
  'text-darkestblue hover:text-darkestorange dark:text-white dark:hover:text-orange';

/**
 * An underline-tab group for one small mutually-exclusive choice — the calendar's
 * Kommende / Tidligere / Alle switcher is the shape it was built for. Styled as a row of
 * nav-link-style tabs (`Link.tsx`'s `navLinkClasses` treatment) rather than a bordered button
 * group, so it reads as one system with the rest of the library instead of a one-off box (#203).
 *
 * **When to reach for this rather than `Chip` or `Dropdown`.** `Chip` reads as a filter:
 * multi-select, additive, and it says nothing about the options you did not pick. `Segmented`
 * says the opposite — these are all the options, exactly one is on. `Dropdown` covers the same
 * single-choice job but hides the options until opened, so it wins as soon as there are more
 * than about four, or the labels are long enough that the group stops fitting on a line at
 * 320px. Sorting is that case on both list pages and uses `Dropdown`; view switching is not
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
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={[segmentBase, sizes[size], value === option.value ? selected : unselected]
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
