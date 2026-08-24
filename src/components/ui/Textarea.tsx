import * as React from 'react';
import AlertCircle from '../../assets/icons/symbols/alert-circle.svg?react';
import Check from '../../assets/icons/symbols/check.svg?react';
import {
  fieldBorder,
  fieldBorderInvalid,
  fieldBorderValid,
  fieldDisabled,
  fieldPadding,
  fieldStateShadow,
  fieldStateTransition,
  fieldSurface,
} from './fieldClasses';

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  /** See `Input` — same contract, same pairing with `FieldError`. */
  invalid?: boolean;
  /** See `Input` — same contract; `invalid` outranks it. */
  valid?: boolean;
};

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className = '', invalid = false, valid = false, ...props },
  ref,
) {
  const affordance = invalid || valid;

  return (
    <div className="relative flex w-full">
      <textarea
        ref={ref}
        aria-invalid={invalid || undefined}
        className={[
          // `h-32 resize-none` is what `ProfileForm` composed onto the shared input string —
          // effectively this component, written inline. `min-h` rather than `h` so a caller
          // can ask for a taller box without fighting a fixed height.
          'min-h-32 w-full resize-none rounded-none',
          fieldSurface,
          invalid ? fieldBorderInvalid : valid ? fieldBorderValid : fieldBorder,
          fieldStateShadow({ invalid, valid }),
          fieldStateTransition,
          fieldDisabled,
          fieldPadding,
          affordance ? 'pr-10 md:pr-11' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      />
      {invalid ? (
        <AlertCircle
          aria-hidden="true"
          className="text-error pointer-events-none absolute top-3 right-3 size-5"
        />
      ) : valid ? (
        <Check
          aria-hidden="true"
          className="text-success pointer-events-none absolute top-3 right-3 size-5"
        />
      ) : null}
    </div>
  );
});
