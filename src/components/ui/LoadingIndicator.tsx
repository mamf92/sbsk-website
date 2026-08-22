import * as React from 'react';

type Size = 'sm' | 'md';

const pipSizes = {
  sm: 'size-1.5',
  md: 'size-2.5',
} as const;

const gaps = {
  sm: 'gap-1',
  md: 'gap-1.5',
} as const;

/**
 * The four stepping pips on their own, with no live region around them. `Button` uses this
 * directly: a button in flight already carries `aria-busy`, and nesting a second status
 * region inside it would announce the same thing twice.
 *
 * `bg-current` rather than a brand colour — the indicator sits on a dark panel as often as a
 * light one, and inheriting the surrounding text colour is the only thing that works on both.
 */
export function LoadingPips({ size = 'md', className = '' }: { size?: Size; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={['inline-flex items-center', gaps[size], className].join(' ')}
    >
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className={['sbsk-load-pip block bg-current', pipSizes[size]].join(' ')} />
      ))}
    </span>
  );
}

type LoadingIndicatorProps = React.HTMLAttributes<HTMLDivElement> & {
  /** What is loading, in Norwegian. Announced politely whether or not it is shown. */
  label?: string;
  /** Keep the label for assistive tech but not on screen — for tight inline slots. */
  labelHidden?: boolean;
  size?: Size;
};

/**
 * The loading state, and the only one. Three screens each had their own — a swapped button
 * label that left the button live, a full-screen blurred overlay, and a bare Suspense string
 * — at three levels of intrusiveness for the same concept.
 *
 * `role="status"` makes it a polite live region, so the label reaches a screen reader when it
 * appears rather than only being painted.
 */
export const LoadingIndicator = React.forwardRef<HTMLDivElement, LoadingIndicatorProps>(
  function LoadingIndicator(
    { label = 'Laster…', labelHidden = false, size = 'md', className = '', ...props },
    ref,
  ) {
    return (
      <div
        ref={ref}
        role="status"
        className={['flex items-center', gaps[size] === 'gap-1' ? 'gap-2' : 'gap-3', className]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        <LoadingPips size={size} />
        <span className={labelHidden ? 'sr-only' : 'font-body'}>{label}</span>
      </div>
    );
  },
);
