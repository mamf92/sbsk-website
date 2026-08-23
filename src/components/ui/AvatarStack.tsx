import * as React from 'react';
import { Avatar, type AvatarSize } from './Avatar';

export type AvatarStackPerson = {
  name: string;
  src?: string;
};

type AvatarStackProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> & {
  people: AvatarStackPerson[];
  /** How many avatars to show before collapsing the rest into "+N". */
  max?: number;
  size?: AvatarSize;
  /** Tuck each avatar a third of its width under the previous one. */
  overlap?: boolean;
  /** Makes the "+N" counter a button. Left off, it renders as plain text. */
  onMore?: () => void;
};

// The library's stack also has a `responsive` mode that measures its container with a
// ResizeObserver and fits as many avatars as it can. Nothing here needs it yet — the calendar
// row shows a fixed three — so it is deliberately not ported. Add it when a consumer asks.
const overlapMargin = {
  xs: '-ml-2',
  sm: '-ml-3',
  md: '-ml-4',
  lg: '-ml-5',
} as const;

const counterBase =
  'inline-flex flex-none items-center justify-center rounded-none border border-black ' +
  'bg-darkblue font-heading font-bold text-white select-none ';

const counterSizes = {
  xs: 'h-6 min-w-6 px-1 text-xs',
  sm: 'h-8 min-w-8 px-1 text-xs',
  md: 'h-11 min-w-11 px-2 text-sm',
  lg: 'h-16 min-w-16 px-2 text-base',
} as const;

export const AvatarStack = React.forwardRef<HTMLDivElement, AvatarStackProps>(
  ({ className = '', people, max = 5, size = 'sm', overlap = false, onMore, ...props }, ref) => {
    const shown = people.slice(0, max);
    const extra = people.length - shown.length;
    const tuck = overlap ? overlapMargin[size] : '';
    const counterClasses = [counterBase, counterSizes[size], tuck].join(' ');

    return (
      <div
        ref={ref}
        className={['flex items-center', overlap ? 'gap-0' : 'gap-1.5', className].join(' ')}
        {...props}
      >
        {shown.map((person, index) => (
          <Avatar
            key={`${person.name}-${index}`}
            name={person.name}
            src={person.src}
            size={size}
            className={index > 0 ? tuck : ''}
          />
        ))}
        {extra > 0 &&
          (onMore ? (
            <button
              type="button"
              onClick={onMore}
              aria-label={`Vis ${extra} deltakere til`}
              className={[
                counterClasses,
                'lift-chip focus-visible:outline-focus-ring cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
              ].join(' ')}
            >
              +{extra}
            </button>
          ) : (
            <span aria-label={`og ${extra} til`} role="img" className={counterClasses}>
              +{extra}
            </span>
          ))}
      </div>
    );
  },
);

AvatarStack.displayName = 'AvatarStack';
