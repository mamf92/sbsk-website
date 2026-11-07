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
import { buttonClasses } from './buttonClasses';
import { Spinner } from './Spinner';
import type { ButtonSize, ButtonVariant } from './buttonClasses';

const icons = {
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
} as const;

export type ButtonIcon = keyof typeof icons | 'none';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** An icon from the shared set. `left` sits before the label; every other icon after it. */
  icon?: ButtonIcon;
  /**
   * A request is in flight: the button disables itself, announces `aria-busy`, and shows a
   * spinner in the icon slot. The label stays, so the button keeps its width and its name.
   */
  loading?: boolean;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'primary',
      size = 'md',
      icon = 'none',
      loading = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const Icon = icon === 'none' ? null : icons[icon];
    const affordance = loading ? (
      <Spinner />
    ) : Icon ? (
      <Icon aria-hidden="true" className="size-4 shrink-0 fill-current" />
    ) : null;

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={buttonClasses({ variant, size, className })}
        {...props}
      >
        {icon === 'left' ? affordance : null}
        {children}
        {icon !== 'left' ? affordance : null}
      </button>
    );
  },
);

Button.displayName = 'Button';
