import type { ReactNode } from 'react';

/**
 * The title of a full-width band on the new front page and calendar: a large heading, then the
 * calendar's own divider under it, with a small uppercase kicker on the left and an optional
 * action (usually a text link) on the right. `invert` is for a navy band.
 */
export function SectionHeading({
  title,
  kicker,
  action,
  invert = false,
  id,
}: {
  title: ReactNode;
  kicker: string;
  action?: ReactNode;
  invert?: boolean;
  id?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h2
        id={id}
        className={`font-heading text-section font-extrabold ${
          invert ? 'text-white' : 'text-darkestblue dark:text-white'
        }`}
      >
        {title}
      </h2>
      <div
        className={`font-heading tracking-heading flex items-baseline justify-between gap-3 border-b border-current pb-1.5 text-xs font-bold uppercase ${
          invert ? 'text-white/80' : 'text-darkestblue/70 dark:text-white/70'
        }`}
      >
        <span>{kicker}</span>
        {action && <span className="tracking-normal normal-case">{action}</span>}
      </div>
    </div>
  );
}

SectionHeading.displayName = 'SectionHeading';
