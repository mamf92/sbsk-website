import AlertTriangle from '../../assets/icons/symbols/alert-triangle.svg?react';

/**
 * «Beskjed på forsiden» on a navy hero: one line of one-off news about an event (cancelled, new
 * venue), white on an orange edge so it is the first thing read. `label` is the screen-reader
 * prefix in the page's language.
 */
export function NoticeLine({ children, label = 'Beskjed' }: { children: string; label?: string }) {
  return (
    <p className="font-heading text-darkestblue border-orange flex w-fit items-center gap-2.5 border-l-8 bg-white px-3 py-2 text-lg font-extrabold">
      <AlertTriangle aria-hidden="true" className="h-5 w-5 flex-none fill-current" />
      <span>
        <span className="sr-only">{label}: </span>
        {children}
      </span>
    </p>
  );
}

NoticeLine.displayName = 'NoticeLine';
