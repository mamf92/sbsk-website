import * as React from 'react';

type CheckboxProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  /** See `Input`. */
  invalid?: boolean;
};

/**
 * The native checkbox, tinted with `accent-color`, so it looks and behaves exactly like every
 * other checkbox the visitor has used. The label stays with the caller, the way the native
 * element expects. `accent-secondary` is navy on light and near-white on dark, and the browser
 * picks a contrasting tick for either.
 */
export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { className = '', invalid = false, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type="checkbox"
      aria-invalid={invalid || undefined}
      className={[
        'accent-secondary size-5 shrink-0 cursor-pointer rounded-none',
        'focus-visible:outline-focus focus-visible:outline-3 focus-visible:outline-offset-2',
        'disabled:cursor-not-allowed',
        invalid ? 'outline-danger-text outline-2' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  );
});
