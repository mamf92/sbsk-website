import * as React from 'react';

export type EventFact = {
  /** Stable key, e.g. 'when'. */
  id: string;
  label: React.ReactNode;
  value: React.ReactNode;
};

type EventFactsProps = Omit<React.HTMLAttributes<HTMLDListElement>, 'children'> & {
  facts: EventFact[];
  /** `row`: its own blue band, one row from `sm` up. `stack`: one fact per line, no fill of its
   *  own, for a card that already has one (`EventKeyInfo`). */
  layout?: 'row' | 'stack';
};

const layouts = {
  row: 'bg-darkblue grid-cols-2 gap-x-4 gap-y-3 p-4 text-white sm:auto-cols-fr sm:grid-flow-col sm:grid-cols-none sm:p-6',
  stack: 'grid-cols-1 gap-y-4',
} as const;

/**
 * The row of key facts under an event's title: when, where, price, sign-up. A definition list,
 * so each value is announced with its label. As a `row`: two columns on a phone, one row from
 * `sm` up.
 * Knows nothing about events: the caller decides which facts exist and formats them.
 */
export const EventFacts = React.forwardRef<HTMLDListElement, EventFactsProps>(
  ({ facts, layout = 'row', className = '', ...props }, ref) => {
    if (facts.length === 0) return null;
    return (
      <dl ref={ref} className={['font-body grid', layouts[layout], className].join(' ')} {...props}>
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
