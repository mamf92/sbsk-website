import * as React from 'react';
import AlertCircle from '../../assets/icons/symbols/alert-circle.svg?react';
import Check from '../../assets/icons/symbols/check.svg?react';
import SearchIcon from '../../assets/icons/symbols/search.svg?react';
import {
  fieldBorder,
  fieldBorderInvalid,
  fieldBorderValid,
  fieldDisabled,
  fieldPadding,
  fieldPaddingWithIcon,
  fieldStateShadow,
  fieldStateTransition,
  fieldSurface,
} from './fieldClasses';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  /**
   * The field-level error treatment: a red hairline, a red hard-offset shadow, the alert
   * glyph, and `aria-invalid` so assistive tech hears about it. The *message* is not this
   * component's job — pair it with `FieldError` and wire the two together with
   * `aria-describedby`.
   */
  invalid?: boolean;
  /**
   * The field-level success treatment: a green hairline, a green hard-offset shadow, and a
   * check glyph. `invalid` outranks it — a field says one thing at a time. Nothing sets this
   * on a first pass at typing; it is for a caller to confirm a field once it has been visited
   * and clears, not to praise every keystroke.
   */
  valid?: boolean;
  /** A trailing affordance. `invalid`, then `valid`, outrank it. */
  icon?: 'search' | 'none';
};

const icons = {
  search: SearchIcon,
  none: null,
} as const;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className = '', invalid = false, valid = false, icon = 'none', ...props },
  ref,
) {
  const Icon = icons[icon];
  const affordance = invalid || valid || Boolean(Icon);

  return (
    // The wrapper exists for the trailing glyph, which has to be positioned against the box.
    // It takes the full width so a caller's flex column lays the field out unchanged.
    <div className="relative flex w-full items-center">
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={[
          'w-full rounded-none',
          fieldSurface,
          invalid ? fieldBorderInvalid : valid ? fieldBorderValid : fieldBorder,
          fieldStateShadow({ invalid, valid }),
          fieldStateTransition,
          fieldDisabled,
          fieldPadding,
          affordance ? fieldPaddingWithIcon : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      />
      {invalid ? (
        <AlertCircle
          aria-hidden="true"
          className="text-error pointer-events-none absolute right-3 size-5"
        />
      ) : valid ? (
        <Check
          aria-hidden="true"
          className="text-success pointer-events-none absolute right-3 size-5"
        />
      ) : Icon ? (
        <Icon
          aria-hidden="true"
          className="pointer-events-none absolute right-3 size-5 text-gray-500"
        />
      ) : null}
    </div>
  );
});
