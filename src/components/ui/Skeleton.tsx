import * as React from 'react';

/**
 * A grey placeholder block in the shape of content that is on its way. Size it with classes
 * (`h-6 w-1/2`, `aspect-video w-full`). It is decorative; the region it sits in announces the
 * wait (see `RouteFallback`). It pulses gently and stops pulsing under reduced motion.
 */
export function Skeleton({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      data-testid="skeleton"
      className={['bg-surface-muted rounded-none motion-safe:animate-pulse', className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  );
}

/** A few lines of placeholder text, the last one shorter, like a real paragraph. */
export function SkeletonText({
  lines = 3,
  className = '',
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div aria-hidden="true" className={['flex flex-col gap-2', className].join(' ')}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={['h-4', i === lines - 1 ? 'w-2/3' : 'w-full'].join(' ')} />
      ))}
    </div>
  );
}

/** The placeholder for one content card: photo, tag, title and a two-line summary. */
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={['bg-surface shadow-card flex flex-col rounded-none', className].join(' ')}
    >
      <Skeleton className="aspect-video w-full" />
      <div className="flex flex-col gap-3 p-4">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-6 w-3/4" />
        <SkeletonText lines={2} />
      </div>
    </div>
  );
}
