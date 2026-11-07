import * as React from 'react';
import Check from '../../assets/icons/symbols/check.svg?react';

type ChipProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
};

const base =
  'inline-flex min-h-9 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-none ' +
  'border px-3 font-body text-sm font-semibold ' +
  'transition-colors duration-150 motion-reduce:transition-none ' +
  'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus';

const states = {
  off: 'border-border-strong bg-transparent text-fg hover:bg-surface-muted',
  on: 'border-secondary bg-secondary text-on-secondary',
} as const;

/**
 * A toggle chip for filters (decision 10). Selected chips fill navy and show a tick, so the
 * state is shape as well as colour, and `aria-pressed` announces it. Category colour is not a
 * chip's job any more; it lives on the cards' tags.
 */
export const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  ({ className = '', active = false, children, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      aria-pressed={active}
      className={[base, active ? states.on : states.off, className].filter(Boolean).join(' ')}
      {...props}
    >
      {active ? <Check aria-hidden="true" className="size-4 shrink-0 fill-current" /> : null}
      {children}
    </button>
  ),
);

Chip.displayName = 'Chip';
