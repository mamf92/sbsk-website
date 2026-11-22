import * as React from 'react';

type StatTileProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> & {
  /** The number (or short value, such as "Betalt" or "–"). */
  value: React.ReactNode;
  /** What the number counts, in a few words. */
  label: string;
  /** `dark` on the portal band and other navy panels; `light` on white. */
  tone?: 'dark' | 'light';
  size?: 'sm' | 'md';
};

// Flat and square like the rest of the system: a hairline box, the value in the heading face,
// the label small underneath. Ported from the design library's members-portal StatTile.
const base = 'flex min-w-0 flex-col gap-1 rounded-none border ';

const tones = {
  dark: 'border-white/30 bg-darkestblue text-white',
  light:
    'border-black bg-white text-darkblue dark:border-white/30 dark:bg-darkestblue dark:text-white',
} as const;

const sizes = {
  sm: 'p-3',
  md: 'p-4',
} as const;

const valueSizes = {
  sm: 'text-h3',
  md: 'text-h2',
} as const;

const labelTones = {
  dark: 'text-gray-100',
  light: 'text-gray-500 dark:text-gray-100',
} as const;

/**
 * A big number with a label: member counts, check-ins, payment status. The value and label are
 * one unit for assistive tech (`<dl>`-free on purpose: a tile stands alone, so a description
 * list of one pair would only add noise). The label is read after the value, as it is seen.
 */
export const StatTile = React.forwardRef<HTMLDivElement, StatTileProps>(
  ({ className = '', value, label, tone = 'dark', size = 'md', ...props }, ref) => (
    <div ref={ref} className={[base, tones[tone], sizes[size], className].join(' ')} {...props}>
      <span className={`font-heading leading-none font-bold ${valueSizes[size]}`}>{value}</span>
      <span className={`font-body text-xs tracking-wide break-words uppercase ${labelTones[tone]}`}>
        {label}
      </span>
    </div>
  ),
);

StatTile.displayName = 'StatTile';
