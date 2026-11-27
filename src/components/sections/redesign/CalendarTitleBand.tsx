import type { ReactNode } from 'react';

/**
 * The navy title band of the new calendar pages: the page's one h1, the club's rhythm in a
 * sentence, and room on the right for the page's own actions.
 */
export function CalendarTitleBand({
  title,
  intro,
  actions,
}: {
  title: string;
  intro?: string;
  actions?: ReactNode;
}) {
  return (
    <section className="bg-darkblue surface-dark dot-pattern relative overflow-hidden text-white">
      <div className="max-w-shell relative mx-auto flex flex-col gap-5 px-4 py-8 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:py-10">
        <div className="flex flex-col gap-3">
          <h1 className="font-heading text-poster font-extrabold">{title}</h1>
          {intro && <p className="font-body max-w-[60ch] text-lg text-white/90">{intro}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
      </div>
    </section>
  );
}
