import * as React from 'react';
import AlertCircle from '../../assets/icons/symbols/alert-circle.svg?react';
import {
  fieldBorder,
  fieldBorderInvalid,
  fieldDisabled,
  fieldPadding,
  fieldSurface,
} from './fieldClasses';

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  /** See `Input` — same contract, same pairing with `FieldError`. */
  invalid?: boolean;
};

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className = '', invalid = false, ...props },
  ref,
) {
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
          invalid ? fieldBorderInvalid : fieldBorder,
          fieldDisabled,
          fieldPadding,
          invalid ? 'pr-10 md:pr-11' : '',
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
      ) : null}
    </div>
  );
});
