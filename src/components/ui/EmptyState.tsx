import * as React from 'react';

type EmptyStateProps = Omit<React.HTMLAttributes<HTMLElement>, 'title'> & {
  title?: string;
  body?: React.ReactNode;
  /** A decorative icon above the title, e.g. the search glyph for "no matches". */
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  /** The next step, usually a `Button`: "Nullstill filtre", "Legg til medlem". */
  action?: React.ReactNode;
  /**
   * `page` is the whole-screen "there is nothing here at all" case; `inline` sits inside a
   * list that has content but no matches. Same shape, different scale.
   */
  variant?: 'page' | 'inline';
  /** A section that already has an `h2` above the list wants `3` here. */
  headingLevel?: 2 | 3;
};

const variants = {
  page: 'items-start px-5 py-8 text-left',
  inline: 'items-center px-4 py-8 text-center',
} as const;

const titleSizes = {
  page: 'text-h2',
  inline: 'text-h3',
} as const;

/**
 * Icon, plain sentence, next step. Colours come from the roles, so it reads on the page and,
 * through `surface-dark`, on a navy panel alike.
 */
export default function EmptyState({
  title,
  body,
  icon: Icon,
  action,
  variant = 'page',
  headingLevel = 2,
  className = '',
  ...props
}: EmptyStateProps) {
  const Heading = headingLevel === 3 ? 'h3' : 'h2';

  return (
    <div
      className={['flex w-full flex-col gap-2', variants[variant], className].join(' ')}
      {...props}
    >
      {Icon ? (
        <Icon aria-hidden="true" className="text-fg-muted mb-1 size-8 shrink-0 fill-current" />
      ) : null}
      {title ? (
        <Heading className={['font-heading text-heading font-bold', titleSizes[variant]].join(' ')}>
          {title}
        </Heading>
      ) : null}
      {body ? <p className="font-body text-fg-muted max-w-[60ch] text-base">{body}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
