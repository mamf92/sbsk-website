import * as React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { buttonClasses } from './buttonClasses';
import { Tag } from './Tag';
import ArrowRight from '../../assets/icons/arrows/arrowright.svg?react';

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
  return (
    <section
      className={[
        'bg-page text-fg flex flex-1 flex-col items-center justify-center gap-6 px-4 py-24',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      <Tag tone="orange">Kommer snart</Tag>

      <h1 className="font-heading text-heading text-h1 max-w-content text-center font-bold">
        {title}
      </h1>

      {description ? (
        <p className="font-body text-fg-muted max-w-form text-center text-base">{description}</p>
      ) : null}

      {actions.length > 0 ? (
        <div className="mt-2 flex flex-row flex-wrap justify-center gap-4">
          {/* Navigation, so links wearing button classes. The first is the one orange action. */}
          {actions.map((action, index) => (
            <RouterLink
              key={action.to}
              to={action.to}
              className={buttonClasses({ variant: index === 0 ? 'primary' : 'secondary' })}
            >
              {action.label}
              <ArrowRight aria-hidden="true" className="size-4 shrink-0 fill-current" />
            </RouterLink>
          ))}
        </div>
      ) : null}
    </section>
  );
}
