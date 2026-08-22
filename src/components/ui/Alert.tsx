import * as React from 'react';
import AlertCircle from '../../assets/icons/symbols/alert-circle.svg?react';

type AlertProps = React.HTMLAttributes<HTMLDivElement> & {
  size?: 'sm' | 'md';
};

/**
 * The error message, announced rather than merely painted. `role="alert"` is the whole point:
 * `LoginSection` and `RegisterSection` rendered failures as orange body text that no screen
 * reader ever mentioned.
 *
 * **Why it paints its own white surface.** `--color-error` is `#b5251f` and both auth forms
 * sit on a `darkblue` panel — red on `#002f5f` measures 2.07:1, so the obvious "red text on
 * the panel" fails badly. A white block with a red hairline, a red glyph and red text is
 * 6.4:1 and works on any surface, which matters because this component has to be usable on a
 * `darkblue` form panel and on the white page alike. It stays flat and square; the brand's
 * only concession here is that it brings its own fill.
 *
 * Error is the only tone, on purpose — there is no success or info case in the app yet, and
 * a tone map with one entry is a guess about the other two.
 */
export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  { size = 'md', className = '', children, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      role="alert"
      className={[
        'border-error text-error font-body flex w-full items-start rounded-none border bg-white',
        size === 'sm' ? 'gap-2 px-2 py-1.5 text-sm' : 'gap-3 px-3 py-2 text-base',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      <AlertCircle
        aria-hidden="true"
        className={['mt-0.5 shrink-0', size === 'sm' ? 'size-4' : 'size-5'].join(' ')}
      />
      <span>{children}</span>
    </div>
  );
});

/**
 * The field-level message, and the counterpart to `invalid` on `Input` / `Textarea` — those
 * own the box's own treatment (the red hairline, the glyph, `aria-invalid`), this owns the
 * words. Wire the two together with `aria-describedby`.
 *
 * It is `Alert` at `sm`, because a field error and a form error are the same statement at two
 * scales and giving them two different looks would say otherwise.
 */
export const FieldError = React.forwardRef<HTMLDivElement, Omit<AlertProps, 'size'>>(
  function FieldError(props, ref) {
    return <Alert ref={ref} size="sm" {...props} />;
  },
);
