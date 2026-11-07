import type { ReactNode } from 'react';

/**
 * The month-heading rule between groups of dated items — "SEPTEMBER 2026" on the calendar,
 * shared with Innlegg's own date-grouped list (#203). `justify-between` so it takes either one
 * child (a month label) or two (a label plus a trailing detail, the calendar's "Neste
 * arrangement" / countdown pair).
 */
export function Divider({ children }: { children: ReactNode }) {
  return (
    <div className="font-heading text-fg-muted border-border flex items-baseline justify-between gap-3 border-b pb-1.5 text-sm font-semibold">
      {children}
    </div>
  );
}

Divider.displayName = 'Divider';
