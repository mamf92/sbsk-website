import * as React from 'react';
import Check from '../../assets/icons/symbols/check.svg?react';
import { fieldBorder, fieldBorderInvalid } from './fieldClasses';

type CheckboxProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  /** See `Input`. */
  invalid?: boolean;
};

/**
 * The control only — the label stays with the caller, the way the native element expects.
 *
 * `appearance-none` plus an overlaid glyph rather than the native tick, because the string
 * this replaces carried `text-darkblue` on a native checkbox, which paints nothing: a native
 * checkbox reads `accent-color`, not `color`. The brand tick was never actually rendering.
 */
export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { className = '', invalid = false, ...props },
  ref,
) {
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center">
      <input
        ref={ref}
        type="checkbox"
        aria-invalid={invalid || undefined}
        className={[
          'peer size-4 appearance-none rounded-none bg-white',
          invalid ? fieldBorderInvalid : fieldBorder,
          // Orange in both themes, not the theme's own text colour. A `darkblue` fill is
          // what the string this replaces implied, and every checkbox in the app sits on a
          // `darkblue` panel — the checked box would have disappeared into it.
          'checked:border-orange checked:bg-orange',
          'disabled:bg-disabled-bg disabled:cursor-not-allowed disabled:border-transparent',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
          'focus-visible:outline-focus-ring',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      />
      <Check
        aria-hidden="true"
        className="text-darkblue pointer-events-none absolute hidden size-3 peer-checked:block"
      />
    </span>
  );
});
