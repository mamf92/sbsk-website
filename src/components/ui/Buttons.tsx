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
import Motion from '../../assets/icons/symbols/motion.svg?react';
import { LoadingPips } from './LoadingIndicator';
import { buttonClasses } from './buttonClasses';
import type { ButtonSize, ButtonVariant } from './buttonClasses';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  /**
   * A request is in flight. The button disables itself and swaps its icon for the stepping
   * pips, keeping the label — and so the width — exactly where it was. Swapping the *label*
   * instead is what `LoginSection` and `RegisterSection` used to do, and because the button
   * stayed live while it said "Logging in...", submitting a registration twice was reachable.
   */
  loading?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
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
    | 'motion'
    | 'none';
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'primary',
      size = 'md',
      icon = 'none',
      loading = false,
      children,
      disabled,
      ...props
    },
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
      motion: Motion,
      none: null,
    };

    const Icon = symbolIcon[icon];
    // The pips take the icon's slot on whichever side the icon was going to be, so the button
    // keeps its layout and its width. `lift` already neutralises `:disabled`, so nothing moves.
    const affordance = loading ? (
      <LoadingPips size={size === 'xs' || size === 'sm' ? 'sm' : 'md'} />
    ) : null;

    return (
      <button
        ref={ref}
        disabled={disabled || loading || variant === 'disabled'}
        aria-busy={loading || undefined}
        className={buttonClasses({
          variant,
          size,
          className: [loading ? 'cursor-wait' : '', className].filter(Boolean).join(' '),
        })}
        {...props}
      >
        {icon === 'left'
          ? (affordance ??
            (Icon ? <Icon className="h-3 min-h-3 w-3 min-w-3 fill-current" /> : null))
          : null}
        {children}
        {icon !== 'left'
          ? (affordance ??
            (Icon ? <Icon className="h-3 min-h-3 w-3 min-w-3 fill-current" /> : null))
          : null}
      </button>
    );
  },
);

Button.displayName = 'Button';
