import type { ReactNode } from 'react';

/**
 * The small uppercase tag above a page's display heading ("BLI MEDLEM"). Orange on the dark
 * brand band; darkestblue ink on orange is 7.6:1. Decoration for sighted readers only in the
 * sense that the heading below it still names the page on its own.
 */
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="font-heading bg-orange text-darkestblue inline-flex w-fit items-center px-2.5 py-1 text-xs font-bold tracking-[0.16em] uppercase">
      {children}
    </span>
  );
}

Eyebrow.displayName = 'Eyebrow';
