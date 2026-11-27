import * as React from 'react';
import sun from '../../assets/icons/symbols/sun.svg?react';
import moon from '../../assets/icons/symbols/moon.svg?react';
import calendarAdd from '../../assets/icons/symbols/calendar-add.svg?react';
import arrowLeft from '../../assets/icons/arrows/arrowleft.svg?react';
import arrowRight from '../../assets/icons/arrows/arrowright.svg?react';

import { iconButtonClasses } from './iconButtonClasses';
import type { IconButtonSize, IconButtonVariant } from './iconButtonClasses';

const icons = { sun, moon, calendarAdd, arrowLeft, arrowRight } as const;

export type IconButtonIcon = keyof typeof icons;

type IconButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'aria-label' | 'children'
> & {
  icon: IconButtonIcon;
  /**
   * Required, and the button's whole accessible name: there is no visible text for a screen
   * reader or voice control to fall back on.
   */
  label: string;
  variant?: IconButtonVariant;
  /** Matches `Button`'s `sm` / `md` height, so it can sit beside a text button. */
  size?: IconButtonSize;
};

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    { icon, label, variant = 'ghost', size = 'md', className = '', type = 'button', ...props },
    ref,
  ) => {
    const Icon = icons[icon];
    return (
      <button
        ref={ref}
        type={type}
        aria-label={label}
        className={iconButtonClasses({ variant, size, className })}
        {...props}
      >
        <Icon aria-hidden="true" focusable="false" className="size-5 fill-current" />
      </button>
    );
  },
);

IconButton.displayName = 'IconButton';
