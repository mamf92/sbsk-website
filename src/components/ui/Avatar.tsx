import * as React from 'react';
import { initials } from '../../utils/initials';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg';

type AvatarProps = Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> & {
  /** Full name. Drives the accessible label and the initials fallback. */
  name: string;
  /** Photo URL. Falls back to initials when absent or empty. */
  src?: string;
  size?: AvatarSize;
};

// Square like everything else in the system — the brand has no radius, and that includes
// avatars, which is what separates this from the usual round social-media chip.
const base =
  'inline-flex flex-none items-center justify-center overflow-hidden rounded-none border ' +
  'border-black bg-gray-100 font-heading font-bold text-darkblue select-none ';

// 24 / 32 / 44 / 64px, the library's avatar scale.
const sizes = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-16 w-16 text-base',
} as const;

export const Avatar = React.forwardRef<HTMLSpanElement, AvatarProps>(
  ({ className = '', name, src, size = 'md', ...props }, ref) => (
    <span
      ref={ref}
      role="img"
      aria-label={name}
      title={name}
      className={[base, sizes[size], className].join(' ')}
      {...props}
    >
      {src ? (
        // The label lives on the wrapper, so the image itself is decorative — a filled `alt`
        // here would have the name announced twice.
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <span aria-hidden="true">{initials(name)}</span>
      )}
    </span>
  ),
);

Avatar.displayName = 'Avatar';
