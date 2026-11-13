import * as React from 'react';

type TagProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: 'blue' | 'orange';
};

// Same API as the redesign proof of concept's `Tag`, styled in the current look: a flat,
// square, uppercase label. The reskin swaps the classes, not the callers.
const base =
  'font-heading inline-flex w-fit items-center rounded-none px-2 py-0.5 text-xs font-bold tracking-[0.14em] uppercase';

const tones = {
  blue: 'bg-darkblue text-white',
  orange: 'bg-orange text-darkestblue',
} as const;

/** A short label on an event or a programme item: its format, an edition, a state. */
export const Tag = React.forwardRef<HTMLSpanElement, TagProps>(
  ({ tone = 'blue', className = '', children, ...props }, ref) => (
    <span ref={ref} className={[base, tones[tone], className].join(' ')} {...props}>
      {children}
    </span>
  ),
);

Tag.displayName = 'Tag';
