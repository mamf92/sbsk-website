import * as React from 'react';
import arrowRight from '../../assets/icons/arrows/arrowright.svg?react';
import arrowLeft from '../../assets/icons/arrows/arrowleft.svg?react';
import arrowDown from '../../assets/icons/arrows/arrowdown.svg?react';
import expand from '../../assets/icons/arrows/expand.svg?react';
import sun from '../../assets/icons/symbols/sun.svg?react';
import moon from '../../assets/icons/symbols/moon.svg?react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'toggle';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  icon?: 'left' | 'right' | 'down' | 'expand' | 'sun' | 'moon' | 'none';
};

const base = 'inline-flex whitespace-nowrap items-center justify-center font-heading text-sm ';

const variants = {
  primary: 'bg-orange text-darkblue hover:bg-darkorange',
  secondary: 'bg-darkorange text-darkestblue hover:bg-orange',
  tertiary: 'bg-darkblue text-white hover:bg-darkestblue',
  toggle: 'bg-darkestblue text-white dark:bg-orange dark:text-darkblue',
} as const;

const sizes = {
  xs: 'h-8 px-2 text-xs',
  sm: 'h-9 px-3 text-sm',
  md: 'py-2 px-3 text-base',
  lg: 'h-12 px-6 text-lg',
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
      none: null,
    };

    const Icon = symbolIcon[icon];
    return (
      <button
        ref={ref}
        className={[base, variants[variant], sizes[size], className].join(' ')}
        {...props}
      >
        {icon === 'left' && Icon ? <Icon className="mr-2 fill-current" /> : null}
        {children}
        {icon !== 'left' && Icon ? <Icon className="ml-2 fill-current" /> : null}
      </button>
    );
  },
);

Button.displayName = 'Button';
