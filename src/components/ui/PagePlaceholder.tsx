import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './Buttons';

export type PagePlaceholderAction = {
  label: string;
  /** A router path. These are all internal, so no external-link handling here. */
  to: string;
};

type PagePlaceholderProps = React.HTMLAttributes<HTMLElement> & {
  title: string;
  /** One sentence on what is coming. Optional, but every current call site has one. */
  description?: string;
  /** Where the reader goes instead. Overriding is for a page that would link to itself. */
  actions?: PagePlaceholderAction[];
};

// A route with no content is still a route a visitor lands on, so the two things they most
// plausibly wanted stay reachable from it. Same pair, in the same order, as the home hero's
// fallback buttons.
const DEFAULT_ACTIONS: PagePlaceholderAction[] = [
  { label: 'Se kalender', to: '/kalender' },
  { label: 'Bli medlem', to: '/bli-medlem' },
];

/**
 * The holding page for a route whose content has not been written yet.
 *
 * One component rather than six stubs, so the dark-mode fill, the `<h1>` and the type scale are
 * decided once. `flex-1` and no `min-h-*`: the shell already gives `main` `flex-1`, and a
 * viewport-height floor on a page with two lines of copy just invents a scrollbar.
 *
 * Deliberately Tailwind-only. `ErrorState` is the nearest existing full-page message and reaches
 * for inline styles for its fluid type; that is #145's problem to unpick and not a pattern to
 * copy into a new component.
 */
export function PagePlaceholder({
  title,
  description,
  actions = DEFAULT_ACTIONS,
  className = '',
  ...props
}: PagePlaceholderProps) {
  const navigate = useNavigate();

  return (
    <section
      className={[
        // No `surface-*`: the fill is the page background in both themes, which is exactly what
        // the theme-level `--hard-shadow-color` already describes.
        'dark:bg-darkestblue text-darkestblue bg-white',
        'flex flex-1 flex-col items-center justify-center gap-6 px-4 py-24 dark:text-white',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      <span className="font-heading border-darkorange text-darkestorange dark:text-orange border px-3 py-1.5 text-xs font-bold tracking-[0.18em] uppercase">
        Kommer snart
      </span>

      <h1 className="font-heading text-h1 tracking-heading max-w-content text-center font-bold">
        {title}
      </h1>

      {description ? (
        <p className="font-body max-w-form text-center text-base">{description}</p>
      ) : null}

      {actions.length > 0 ? (
        <div className="mt-2 flex flex-row flex-wrap justify-center gap-4">
          {/* All `primary` (#223). `secondary` is `darkorange` against `primary`'s `orange` —
              two fills a shade apart, which on a page whose only content is these buttons
              reads as one of them being subtly wrong rather than as a hierarchy. Neither
              destination outranks the other here anyway. */}
          {actions.map((action) => (
            <Button
              key={action.to}
              onClick={() => navigate(action.to)}
              variant="primary"
              size="lg"
              icon="right"
            >
              {action.label}
            </Button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
