import * as React from 'react';

type EmptyStateProps = Omit<React.HTMLAttributes<HTMLElement>, 'title'> & {
  title?: string;
  body?: React.ReactNode;
  /** Usually a `Button` — "Fjern filtre", "Legg til medlem". */
  action?: React.ReactNode;
  /**
   * `page` is the whole-screen "there is nothing here at all" case; `inline` is the one that
   * sits inside a list that has content but no matches. Same shape, different scale.
   */
  variant?: 'page' | 'inline';
  /** A section that already has an `h2` above the list wants `3` here. */
  headingLevel?: 2 | 3;
  /**
   * `page` (default) sets the page text pair, so the copy stays readable on both themes.
   * `inherit` is for a surface that fixes its own text colour, such as `Panel`.
   */
  tone?: 'page' | 'inherit';
};

const tones = {
  page: 'text-darkestblue dark:text-white',
  inherit: '',
} as const;

const variants = {
  page: 'items-start px-5 py-8 text-left',
  inline: 'items-center px-4 py-6 text-center',
} as const;

const titleSizes = {
  page: 'text-h2',
  inline: 'text-h3',
} as const;

/**
 * Heading, body, optional action — the shape `PostsSection` already had and the other three
 * empty screens did not. The old board member list in particular rendered two bare `<p>` tags.
 *
 * It sets the page text pair by default, because a bare page in dark mode has no text colour of
 * its own and the copy came out black on `darkblue`. Pass `tone="inherit"` inside a `Panel`.
 * `ErrorState` is this same shape at full-page scale with the brand's 404 furniture attached.
 */
export default function EmptyState({
  title,
  body,
  action,
  variant = 'page',
  headingLevel = 2,
  tone = 'page',
  className = '',
  ...props
}: EmptyStateProps) {
  const Heading = headingLevel === 3 ? 'h3' : 'h2';

  return (
    <div
      className={['flex w-full flex-col gap-2', variants[variant], tones[tone], className].join(
        ' ',
      )}
      {...props}
    >
      {title ? (
        <Heading className={['font-heading font-bold', titleSizes[variant]].join(' ')}>
          {title}
        </Heading>
      ) : null}
      {body ? <p className="font-body max-w-[60ch] text-base">{body}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
