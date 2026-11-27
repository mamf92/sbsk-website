import type { ReactNode } from 'react';

export type Fact = {
  key: string;
  /** A decorative icon; the content says the fact on its own. */
  icon: ReactNode;
  content: ReactNode;
};

/**
 * The inset strip of two to four short facts between two hairlines, with half-height dividers
 * between cells: difficulty, time and players on a game card; time, place and sign-up on an
 * event poster. Takes the ink of the card it sits in.
 */
export function FactsStrip({ facts }: { facts: Fact[] }) {
  return (
    <div className="my-3 flex border-t border-b border-black dark:border-white">
      {facts.map((fact, i) => (
        <div
          key={fact.key}
          className={`flex min-w-0 flex-1 flex-row items-center justify-center gap-1.5 p-2 text-center ${
            i
              ? 'relative before:absolute before:top-2.5 before:bottom-2.5 before:left-0 before:w-px before:bg-gray-300 dark:before:bg-white/30'
              : ''
          }`}
        >
          {fact.icon}
          {fact.content}
        </div>
      ))}
    </div>
  );
}

FactsStrip.displayName = 'FactsStrip';
