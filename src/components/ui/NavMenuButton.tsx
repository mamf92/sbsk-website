import * as React from 'react';

type NavMenuButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  open?: boolean;
};

// Three bars that fold into an X: the familiar hamburger. 44px target, colour from the text
// around it, and the bars only move when the OS allows motion.
const base =
  'inline-flex size-11 cursor-pointer flex-col items-center justify-center gap-[5px] ' +
  'rounded-none border-0 bg-transparent text-current transition-colors duration-150 ' +
  'hover:bg-surface-muted motion-reduce:transition-none ' +
  'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus';

// 2px bar, 5px gap: the outer bars sit 7px off centre, so that is how far they travel.
const bar =
  'block h-0.5 w-6 bg-current transition-transform duration-200 ease-out ' +
  'motion-reduce:transition-none';
const middleBar =
  'block h-0.5 w-6 bg-current transition-opacity duration-150 motion-reduce:transition-none';

export const NavMenuButton = React.forwardRef<HTMLButtonElement, NavMenuButtonProps>(
  ({ className = '', open = false, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      aria-expanded={open}
      aria-label={open ? 'Lukk meny' : 'Åpne meny'}
      className={[base, className].join(' ')}
      {...props}
    >
      <span className={`${bar} ${open ? 'translate-y-[7px] rotate-45' : ''}`} />
      <span className={`${middleBar} ${open ? 'opacity-0' : 'opacity-100'}`} />
      <span className={`${bar} ${open ? '-translate-y-[7px] -rotate-45' : ''}`} />
    </button>
  ),
);

NavMenuButton.displayName = 'NavMenuButton';
