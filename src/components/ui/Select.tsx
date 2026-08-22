import * as React from 'react';
import {
  fieldBorder,
  fieldBorderInvalid,
  fieldDisabled,
  fieldPadding,
  fieldSurface,
} from './fieldClasses';

export type SelectOption = {
  value: string;
  label: string;
};

type SelectProps = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> & {
  options: readonly SelectOption[];
  /** The field-level error treatment, matching `Input` and `Textarea`. */
  invalid?: boolean;
};

/**
 * The single-choice control for when the options are too many or too long to sit on a line,
 * and the one sort control on both list pages.
 *
 * **Options rather than children.** Every caller had an array already, and the two that
 * hand-wrote `<option>` elements both had to remember a colour class on each one to survive
 * dark mode. Passing the array leaves nothing to remember. It also rules out `<optgroup>`,
 * which nothing here needs; if something does, that is the moment to widen this.
 *
 * **The native arrow stays.** No `appearance-none` and no custom chevron: the platform
 * picker is the reason to choose a `<select>` over `Segmented` in the first place, and on
 * mobile it is a full-height wheel that no reimplementation matches.
 *
 * **No width.** A `<select>` sizes to its longest option, which is right in a toolbar and
 * wrong in a form column, so the caller decides. Setting `w-full` here and overriding it with
 * `className` would not work reliably anyway — both are width utilities in the same layer, so
 * the stylesheet order decides the winner, not the order they appear in the attribute.
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className = '', options, invalid = false, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      aria-invalid={invalid || undefined}
      className={[
        'cursor-pointer rounded-none',
        fieldSurface,
        invalid ? fieldBorderInvalid : fieldBorder,
        fieldDisabled,
        fieldPadding,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
});
