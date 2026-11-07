import * as React from 'react';
import { Spinner } from './Spinner';

type LoadingIndicatorProps = React.HTMLAttributes<HTMLDivElement> & {
  /** What is loading, in Norwegian. Announced politely whether or not it is shown. */
  label?: string;
  /** Keep the label for assistive tech but not on screen, for tight inline slots. */
  labelHidden?: boolean;
  size?: 'sm' | 'md';
};

/**
 * A spinner and a label, for waits that have no layout to sketch (the Studio chunk, an action
 * in flight). When the shape of what is coming is known, prefer `Skeleton`.
 *
 * `role="status"` makes it a polite live region, so the label reaches a screen reader.
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
        className={['flex items-center', size === 'sm' ? 'gap-2' : 'gap-3', className]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        <Spinner size={size} />
        <span className={labelHidden ? 'sr-only' : 'font-body'}>{label}</span>
      </div>
    );
  },
);
