import * as React from 'react';
import AlertCircle from '../../assets/icons/symbols/alert-circle.svg?react';
import Check from '../../assets/icons/symbols/check.svg?react';
import { fieldBase, fieldDisabled, fieldLineFor, fieldPaddingWithIcon } from './fieldClasses';

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  /** See `Input`: same contract, same pairing with `FieldError`. */
  invalid?: boolean;
  /** See `Input`; `invalid` outranks it. */
  valid?: boolean;
};

const glyph = 'pointer-events-none absolute top-3 right-3 size-5';

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className = '', invalid = false, valid = false, ...props },
  ref,
) {
  return (
    <div className="relative flex w-full">
      <textarea
        ref={ref}
        aria-invalid={invalid || undefined}
        className={[
          fieldBase,
          'min-h-32 resize-y',
          fieldLineFor({ invalid, valid }),
          fieldDisabled,
          invalid || valid ? fieldPaddingWithIcon : '',
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
      ) : null}
    </div>
  );
});
