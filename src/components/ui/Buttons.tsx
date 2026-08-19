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
import { LoadingPips } from './LoadingIndicator';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  /**
   * A request is in flight. The button disables itself and swaps its icon for the stepping
   * pips, keeping the label — and so the width — exactly where it was. Swapping the *label*
   * instead is what `LoginSection` and `RegisterSection` used to do, and because the button
   * stayed live while it said "Logging in...", submitting a registration twice was reachable.
   */
  loading?: boolean;
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
// The brand stays flat — sharp corners, no blur, no soft elevation, no scale — but it is not
// static: the button lifts up-left onto a hard offset shadow on hover and settles on press.
// Motion lives in `motion` below rather than here, because `disabled` opts out of it.
const base =
  'inline-flex whitespace-nowrap items-center justify-center font-heading rounded-none ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange ';

// `not-disabled:hover:` rather than `hover:`, because `:hover` still matches a disabled
// element. Any variant can carry the attribute — a `loading` button always does — and without
// this a button that cannot be clicked still lights up under the pointer. `lift` already
// neutralises the travel and the shadow for the same reason; this is the colour half.
const variants = {
  primary: 'bg-orange text-darkblue not-disabled:hover:bg-darkorange',
  secondary: 'bg-darkorange text-darkestblue not-disabled:hover:bg-orange',
  tertiary: 'bg-darkblue text-white not-disabled:hover:bg-darkestblue',
  disabled: 'bg-gray-300 text-gray-500 cursor-not-allowed',
  toggle: 'bg-darkestblue text-white dark:bg-orange dark:text-darkblue',
} as const;

// `lift` (src/index.css) carries the hover/press micro-action *and* the colour swap on one
// transition-property. `disabled` is the exception: nothing there is pressable, so it keeps
// the bare colour transition and never moves.
const motion = {
  primary: 'lift',
  secondary: 'lift',
  tertiary: 'lift',
  toggle: 'lift',
  // `--duration-*` is not a Tailwind utility namespace, so this reads the var directly
  // rather than via a `duration-fast` class, which would not compile.
  disabled: 'transition-colors duration-(--duration-fast) ease-standard',
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
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={[
          base,
          variants[variant],
          motion[variant],
          sizes[size],
          loading ? 'cursor-wait' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {icon === 'left'
          ? (affordance ??
            (Icon ? <Icon className="h-3 min-h-3 w-5 min-w-2 fill-current" /> : null))
          : null}
        {children}
        {icon !== 'left'
          ? (affordance ??
            (Icon ? <Icon className="h-5 min-h-2 w-3 min-w-3 fill-current" /> : null))
          : null}
      </button>
    );
  },
);

Button.displayName = 'Button';
