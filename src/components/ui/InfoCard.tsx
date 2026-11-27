import type { ReactNode } from 'react';

/**
 * A cream card on a hard shadow with a title and labelled rows between hairlines: «Godt å vite»
 * on an event page, «Påmelding og priser» on a festival. The ink is darkestblue in both themes,
 * since the card stays cream; in dark mode the shadow turns black so it does not glare.
 */
export function InfoCard({
  title,
  icon,
  children,
  className = '',
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-cream text-darkestblue border border-black p-5 shadow-[10px_10px_0_var(--color-darkestblue)] dark:shadow-[10px_10px_0_black] ${className}`}
    >
      <h2 className="font-heading text-h3 mb-3 flex items-center gap-2 font-extrabold">
        {icon}
        {title}
      </h2>
      {children}
    </div>
  );
}

/** The rows of an `InfoCard`, as a description list. */
export function InfoList({ children }: { children: ReactNode }) {
  return <dl>{children}</dl>;
}

export function InfoRow({
  label,
  children,
  lang,
}: {
  label: string;
  children: ReactNode;
  lang?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 border-t border-black/15 py-3 first:border-t-0 first:pt-0 last:pb-0">
      <dt className="font-heading text-xs font-extrabold tracking-[0.14em] uppercase opacity-70">
        {label}
      </dt>
      <dd className="font-body" lang={lang}>
        {children}
      </dd>
    </div>
  );
}

InfoCard.displayName = 'InfoCard';
InfoList.displayName = 'InfoList';
InfoRow.displayName = 'InfoRow';
