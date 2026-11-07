import * as React from 'react';

export type TagTone = 'blue' | 'orange';

const tones = {
  blue: 'bg-tag-blue-bg text-tag-blue-fg',
  orange: 'bg-tag-orange-bg text-tag-orange-fg',
} as const;

/**
 * A small category label. This is the only place category colour appears: never as a card's
 * fill (decision 4). Two tones, blue and orange, both measured at 4.5:1 or better.
 */
export function Tag({
  tone = 'blue',
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: TagTone }) {
  return (
    <span
      className={[
        'font-body inline-flex items-center rounded-none px-2 py-0.5 text-xs font-semibold',
        tones[tone],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </span>
  );
}
