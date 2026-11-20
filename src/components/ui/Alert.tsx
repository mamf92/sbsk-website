import * as React from 'react';
import AlertCircle from '../../assets/icons/symbols/alert-circle.svg?react';
import AlertTriangle from '../../assets/icons/symbols/alert-triangle.svg?react';
import Check from '../../assets/icons/symbols/check.svg?react';
import Info from '../../assets/icons/symbols/info.svg?react';

export type AlertTone = 'info' | 'success' | 'warning' | 'error';

type AlertProps = React.HTMLAttributes<HTMLDivElement> & {
  size?: 'sm' | 'md';
  /** Defaults to `error`, the only tone this had until #180. */
  tone?: AlertTone;
};

const toneConfig = {
  info: {
    Glyph: Info,
    role: 'status',
    border: 'border-darkblue',
    tab: 'bg-darkblue text-white',
  },
  success: {
    Glyph: Check,
    role: 'status',
    border: 'border-success',
    tab: 'bg-success text-white',
  },
  // Yellow with dark ink: white on yellow is ~1.9:1. The hairline is `darkestorange`
  // (4.5:1 on white) because yellow alone would not outline the box on a white page.
  warning: {
    Glyph: AlertTriangle,
    role: 'status',
    border: 'border-darkestorange',
    tab: 'bg-yellow text-darkestblue',
  },
  error: {
    Glyph: AlertCircle,
    role: 'alert',
    border: 'border-error',
    tab: 'bg-error text-white',
  },
} as const;

/**
 * The form message: info, success, warning or error, announced rather than merely painted.
 * `role="alert"` (assertive) is reserved for `error`; the other tones are `role="status"`
 * (polite), because a confirmation or a heads-up should not interrupt the way a failure does.
 *
 * **Why it paints its own white surface.** The auth forms sit on a `darkblue` panel, and
 * coloured text on it fails (red is 2.07:1, green is no better), while a tinted fill would
 * change meaning with whatever sits behind it. A white block with dark ink text is 16:1 on
 * any surface and in both themes, so it is legible on the white page, the `darkblue` panel
 * and the dark-mode page alike.
 *
 * **Tone lives in the icon tab, never in the text.** A solid tab at the left carries the tone
 * colour and its glyph (check, info, triangle, circle-bang), plus a hairline in the same
 * colour. The text stays ink, so colour is never the only signal: the glyph shape differs
 * per tone, and the live-region role carries it for assistive tech. Flat and square, no
 * shadow: nothing here is pressable, so it does not take `lift`.
 *
 * (The first version, #180, was a white box with green or red text and glyph. Green text
 * on a white box inside a navy panel read as a foreign object; the tab gives each tone one
 * strong, brand-consistent anchor instead.)
 */
export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  { size = 'md', tone = 'error', className = '', children, ...props },
  ref,
) {
  const { Glyph, role, border, tab } = toneConfig[tone];
  const sm = size === 'sm';

  return (
    <div
      ref={ref}
      role={role}
      className={[
        border,
        'font-body text-darkestblue flex w-full items-stretch rounded-none border bg-white',
        sm ? 'text-sm' : 'text-base',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      <span
        aria-hidden="true"
        className={[
          tab,
          'flex shrink-0 items-start justify-center',
          sm ? 'w-8 pt-1.5' : 'w-10 pt-2.5',
        ].join(' ')}
      >
        <Glyph className={sm ? 'size-4' : 'size-5'} />
      </span>
      <span className={sm ? 'px-2 py-1.5' : 'px-3 py-2'}>{children}</span>
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
