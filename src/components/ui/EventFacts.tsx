import * as React from 'react';

export type EventFact = {
  /** Stable key, e.g. 'when'. */
  id: string;
  label: React.ReactNode;
  value: React.ReactNode;
};

type EventFactsProps = Omit<React.HTMLAttributes<HTMLDListElement>, 'children'> & {
  facts: EventFact[];
};

/**
 * The row of key facts under an event's title: when, where, price, sign-up. A definition list,
 * so each value is announced with its label. Two columns on a phone, one row from `sm` up.
 * Knows nothing about events: the caller decides which facts exist and formats them.
 */
export const EventFacts = React.forwardRef<HTMLDListElement, EventFactsProps>(
  ({ facts, className = '', ...props }, ref) => {
    if (facts.length === 0) return null;
    return (
      <dl
        ref={ref}
        className={[
          'bg-darkblue font-body grid grid-cols-2 gap-x-4 gap-y-3 p-4 text-white sm:auto-cols-fr sm:grid-flow-col sm:grid-cols-none sm:p-6',
          className,
        ].join(' ')}
        {...props}
      >
        {facts.map((fact) => (
          <div key={fact.id} className="flex min-w-0 flex-col gap-1">
            <dt className="font-heading text-orange text-xs font-bold tracking-[0.14em] uppercase">
              {fact.label}
            </dt>
            <dd className="text-base break-words">{fact.value}</dd>
          </div>
        ))}
      </dl>
    );
  },
);

EventFacts.displayName = 'EventFacts';
