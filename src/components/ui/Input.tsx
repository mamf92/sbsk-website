import * as React from 'react';
import AlertCircle from '../../assets/icons/symbols/alert-circle.svg?react';
import SearchIcon from '../../assets/icons/symbols/search.svg?react';
import {
  fieldBorder,
  fieldBorderInvalid,
  fieldDisabled,
  fieldPadding,
  fieldPaddingWithIcon,
  fieldSurface,
} from './fieldClasses';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  /**
   * The field-level error treatment: a red hairline, the alert glyph, and `aria-invalid` so
   * assistive tech hears about it. The *message* is not this component's job — pair it with
   * `FieldError` and wire the two together with `aria-describedby`.
   */
  invalid?: boolean;
  /** A trailing affordance. `invalid` outranks it — a field cannot say two things at once. */
  icon?: 'search' | 'none';
};

const icons = {
  search: SearchIcon,
  none: null,
} as const;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className = '', invalid = false, icon = 'none', ...props },
  ref,
) {
  const Icon = icons[icon];
  const affordance = invalid || Boolean(Icon);

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
          invalid ? fieldBorderInvalid : fieldBorder,
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
      ) : Icon ? (
        <Icon
          aria-hidden="true"
          className="pointer-events-none absolute right-3 size-5 text-gray-500"
        />
      ) : null}
    </div>
  );
});
