import * as React from 'react';
import AlertCircle from '../../assets/icons/symbols/alert-circle.svg?react';
import Check from '../../assets/icons/symbols/check.svg?react';
import SearchIcon from '../../assets/icons/symbols/search.svg?react';
import { fieldBase, fieldDisabled, fieldLineFor, fieldPaddingWithIcon } from './fieldClasses';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  /**
   * The error state: a red bottom line, the alert glyph and `aria-invalid`. The message is
   * `FieldError`'s job; wire the two together with `aria-describedby`.
   */
  invalid?: boolean;
  /** A green line and a check, for a caller confirming a visited field. `invalid` wins. */
  valid?: boolean;
  /** A trailing affordance. `invalid`, then `valid`, outrank it. */
  icon?: 'search' | 'none';
};

const glyph = 'pointer-events-none absolute right-3 size-5';

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className = '', invalid = false, valid = false, icon = 'none', ...props },
  ref,
) {
  const affordance = invalid || valid || icon !== 'none';

  return (
    // The wrapper positions the trailing glyph against the box, at full width so a caller's
    // flex column lays the field out unchanged.
    <div className="relative flex w-full items-center">
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={[
          fieldBase,
          fieldLineFor({ invalid, valid }),
          fieldDisabled,
          affordance ? fieldPaddingWithIcon : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      />
      {invalid ? (
        <AlertCircle aria-hidden="true" className={`${glyph} text-danger-text`} />
      ) : valid ? (
        <Check aria-hidden="true" className={`${glyph} text-success-text`} />
      ) : icon === 'search' ? (
        <SearchIcon aria-hidden="true" className={`${glyph} text-fg-muted`} />
      ) : null}
    </div>
  );
});
