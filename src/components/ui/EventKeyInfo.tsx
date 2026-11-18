import * as React from 'react';
import { EventFacts, type EventFact } from './EventFacts';

type EventKeyInfoProps = Omit<React.HTMLAttributes<HTMLElement>, 'children'> & {
  facts: EventFact[];
  /** The landmark's name, in the page's language. */
  label: string;
  /** The calls to action under the facts: sign-up, add to calendar, see programme. */
  actions?: React.ReactNode;
};

/**
 * The summary card of an event: when, where, price and sign-up state, then what to do about
 * it. It plays the part of the Figma design's orange summary card, and lives in
 * `EventPageLayout`'s aside so it stays beside the content on a wide screen.
 */
export const EventKeyInfo = React.forwardRef<HTMLElement, EventKeyInfoProps>(
  ({ facts, label, actions, className = '', ...props }, ref) => {
    if (facts.length === 0 && !actions) return null;
    return (
      <aside
        ref={ref}
        aria-label={label}
        className={[
          'bg-darkblue surface-dark flex flex-col gap-4 border border-black p-4 text-white sm:p-6 dark:border-white',
          className,
        ].join(' ')}
        {...props}
      >
        <EventFacts facts={facts} layout="stack" />
        {actions && (
          <div className="flex flex-col items-start gap-3 border-t border-white/20 pt-4 first:border-t-0 first:pt-0">
            {actions}
          </div>
        )}
      </aside>
    );
  },
);

EventKeyInfo.displayName = 'EventKeyInfo';
