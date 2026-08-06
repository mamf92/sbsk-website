import * as React from 'react';

type NavMenuButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  open?: boolean;
};

// Three bars that fold into an X. Built from spans rather than an icon because the bars are
// the animation — there is no closed-form "menu" and "close" glyph to swap between.
const base =
  'inline-flex size-[42px] cursor-pointer flex-col items-center justify-center gap-[5px] ' +
  'rounded-none border-0 bg-transparent text-current lift ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ' +
  'focus-visible:outline-focus-ring ';

// 2px bar, 5px gap: the outer bars sit exactly 7px off centre, so that is how far they
// travel to meet in the middle before rotating.
const bar = 'block h-0.5 w-6 bg-current transition-transform duration-(--duration-base) ease-out';
const middleBar =
  'block h-0.5 w-6 bg-current transition-opacity duration-(--duration-fast) ease-standard';

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
