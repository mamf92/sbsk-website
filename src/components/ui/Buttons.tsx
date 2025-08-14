import * as React from 'react';
import arrowRight from '../../assets/icons/arrows/arrowright.svg?react';
import arrowLeft from '../../assets/icons/arrows/arrowleft.svg?react';
import arrowDown from '../../assets/icons/arrows/arrowdown.svg?react';
import expand from '../../assets/icons/arrows/expand.svg?react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'tertiary';
  size?: 'sm' | 'md' | 'lg';
  arrow?: 'left' | 'right' | 'down' | 'expand' | 'none';
};

const base = 'inline-flex whitespace-nowrap items-center justify-center font-heading text-sm ';

const variants = {
  primary: 'bg-orange text-darkblue hover:bg-darkorange',
  secondary: 'bg-darkorange text-darkestblue hover:bg-orange',
  tertiary: 'bg-darkblue text-white hover:bg-darkestblue',
} as const;

const sizes = {
  sm: 'h-9 px-3 text-sm',
  md: 'py-2 px-3 text-base',
  lg: 'h-12 px-6 text-lg',
} as const;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className = '', variant = 'primary', size = 'md', arrow = 'none', children, ...props },
    ref,
  ) => {
    const arrowIcon = {
      left: arrowLeft,
      right: arrowRight,
      down: arrowDown,
      expand: expand,
      none: null,
    };

    const Icon = arrowIcon[arrow];
    return (
      <button
        ref={ref}
        className={[base, variants[variant], sizes[size], className].join(' ')}
        {...props}
      >
        {arrow === 'left' && Icon ? <Icon className="mr-2 fill-current" /> : null}
        {children}
        {arrow !== 'left' && Icon ? <Icon className="ml-2 fill-current" /> : null}
      </button>
    );
  },
);

Button.displayName = 'Button';
