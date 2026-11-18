import * as React from 'react';

type EventPageLayoutProps = React.HTMLAttributes<HTMLDivElement> & {
  /** The key facts and the sign-up: `EventKeyInfo`. */
  aside: React.ReactNode;
};

/**
 * The body of an event page: the content column, and beside it from `lg` up a narrow column with
 * the key facts and the sign-up that stays in view while the visitor reads the programme. On a
 * phone the aside comes first, straight under the title, so when, where and how to sign up are
 * never below the fold. It is also first in the source, so that is the reading order too.
 */
export const EventPageLayout = React.forwardRef<HTMLDivElement, EventPageLayoutProps>(
  ({ aside, className = '', children, ...props }, ref) => (
    <div
      ref={ref}
      className={[
        'gap-stack grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_var(--container-aside)] lg:items-start',
        className,
      ].join(' ')}
      {...props}
    >
      <div className="lg:sticky lg:top-2 lg:order-2 print:hidden">{aside}</div>
      <div className="gap-stack flex min-w-0 flex-col lg:order-1">{children}</div>
    </div>
  ),
);

EventPageLayout.displayName = 'EventPageLayout';
