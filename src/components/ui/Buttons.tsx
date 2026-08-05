import * as React from 'react';
import arrowRight from '../../assets/icons/arrows/arrowright.svg?react';
import arrowLeft from '../../assets/icons/arrows/arrowleft.svg?react';
import arrowDown from '../../assets/icons/arrows/arrowdown.svg?react';
import expand from '../../assets/icons/arrows/expand.svg?react';
import sun from '../../assets/icons/symbols/sun.svg?react';
import moon from '../../assets/icons/symbols/moon.svg?react';
import backspace from '../../assets/icons/symbols/backspace.svg?react';
import block from '../../assets/icons/symbols/block.svg?react';
import AscIcon from '../../assets/icons/symbols/asc.svg?react';
import DescIcon from '../../assets/icons/symbols/desc.svg?react';
import Add from '../../assets/icons/symbols/add.svg?react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'toggle' | 'disabled';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  icon?:
    | 'left'
    | 'right'
    | 'down'
    | 'expand'
    | 'sun'
    | 'moon'
    | 'backspace'
    | 'block'
    | 'asc'
    | 'desc'
    | 'add'
    | 'none';
};

// No size here: each entry in `sizes` owns its font size, so a base size would leak into `xs`.
// The brand is flat — a 120ms colour swap only, never elevation or scale.
const base =
  'inline-flex whitespace-nowrap items-center justify-center font-heading rounded-none ' +
  'transition-colors duration-[120ms] ease-standard ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange ';

const variants = {
  primary: 'bg-orange text-darkblue hover:bg-darkorange',
  secondary: 'bg-darkorange text-darkestblue hover:bg-orange',
  tertiary: 'bg-darkblue text-white hover:bg-darkestblue',
  disabled: 'bg-gray-300 text-gray-500 cursor-not-allowed',
  toggle: 'bg-darkestblue text-white dark:bg-orange dark:text-darkblue',
} as const;

// height · padding-x · font-size/weight, per the design library scale.
const sizes = {
  xs: 'h-8 px-2 text-xs gap-1',
  sm: 'h-9 px-3 text-xs font-bold gap-2',
  md: 'h-11 px-4 text-base gap-2',
  lg: 'h-12 px-6 text-base font-bold gap-2',
} as const;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className = '', variant = 'primary', size = 'md', icon = 'none', children, ...props },
    ref,
  ) => {
    const symbolIcon = {
      left: arrowLeft,
      right: arrowRight,
      down: arrowDown,
      expand: expand,
      sun: sun,
      moon: moon,
      backspace: backspace,
      block: block,
      asc: AscIcon,
      desc: DescIcon,
      add: Add,
      none: null,
    };

    const Icon = symbolIcon[icon];
    return (
      <button
        ref={ref}
        className={[base, variants[variant], sizes[size], className].join(' ')}
        {...props}
      >
        {icon === 'left' && Icon ? <Icon className="h-3 min-h-3 w-5 min-w-2 fill-current" /> : null}
        {children}
        {icon !== 'left' && Icon ? <Icon className="h-5 min-h-2 w-3 min-w-3 fill-current" /> : null}
      </button>
    );
  },
);

Button.displayName = 'Button';
