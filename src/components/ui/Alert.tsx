import * as React from 'react';
import AlertCircle from '../../assets/icons/symbols/alert-circle.svg?react';
import Check from '../../assets/icons/symbols/check.svg?react';
import Info from '../../assets/icons/symbols/info.svg?react';

type Tone = 'info' | 'success' | 'error';

type AlertProps = React.HTMLAttributes<HTMLDivElement> & {
  size?: 'sm' | 'md';
  /** Defaults to `error`, the most common case in the forms. */
  tone?: Tone;
};

const tones = {
  info: { glyph: Info, classes: 'border-info-text bg-info-bg text-info-text' },
  success: { glyph: Check, classes: 'border-success-text bg-success-bg text-success-text' },
  error: { glyph: AlertCircle, classes: 'border-danger-text bg-danger-bg text-danger-text' },
} as const;

/**
 * A message box: a tinted fill, a 4px bar on the left, an icon and a plain sentence, in blue,
 * green or red. An error is `role="alert"` so it interrupts; info and success are
 * `role="status"` so they are announced politely.
 *
 * The tints and inks are status tokens, which `surface-dark` and `on-dark` re-point to their
 * dark-theme values, so the same Alert stays legible on a navy form panel.
 */
export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  { size = 'md', tone = 'error', className = '', children, ...props },
  ref,
) {
  const { glyph: Glyph, classes } = tones[tone];

  return (
    <div
      ref={ref}
      role={tone === 'error' ? 'alert' : 'status'}
      className={[
        classes,
        'font-body flex w-full items-start rounded-none border-l-4',
        size === 'sm' ? 'gap-2 px-3 py-2 text-sm' : 'gap-3 px-4 py-3 text-base',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      <Glyph
        aria-hidden="true"
        className={['shrink-0', size === 'sm' ? 'mt-0.5 size-4' : 'mt-0.5 size-5'].join(' ')}
      />
      <span>{children}</span>
    </div>
  );
});

/**
 * The fix-it message under a field: red text with an icon, no box. Pair it with `invalid` on
 * `Input` / `Textarea` and wire the two together with `aria-describedby`.
 */
export const FieldError = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function FieldError({ className = '', children, ...props }, ref) {
    return (
      <div
        ref={ref}
        role="alert"
        className={['font-body text-danger-text flex items-start gap-1.5 text-sm', className]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <span>{children}</span>
      </div>
    );
  },
);
