import * as React from 'react';
import BadgeArt from '../../assets/icons/badges/badge.svg?react';

type BadgeTileProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  name: string;
  earned: boolean;
  /** One short line under the name: the date earned, or progress such as "3 av 10". */
  detail?: string;
};

// Flat and square on the navy panels, like StatTile. Earned badges carry the brand orange;
// locked ones are the same shape in a muted white, so the grid reads as one set.
const base =
  'lift font-body flex min-w-0 flex-col items-center gap-2 rounded-none border p-3 text-center ' +
  'border-white/30 bg-darkestblue text-white';

/**
 * One badge: dice-shaped art with the badge's initial, its name and a detail line. A button,
 * because the grid opens the badge's description from it; the accessible name says whether it
 * is earned, since the colour alone does not, and carries the detail line too.
 *
 * A raw `<button>` rather than `Button`, like `IconButton`: a tile is a card-shaped target with
 * stacked content, not one of the system's text buttons and sizes.
 */
export const BadgeTile = React.forwardRef<HTMLButtonElement, BadgeTileProps>(
  ({ name, earned, detail, className = '', type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      aria-label={[name, earned ? 'oppnådd' : 'ikke oppnådd ennå', detail]
        .filter(Boolean)
        .join(', ')}
      className={[base, className].join(' ')}
      {...props}
    >
      <span
        aria-hidden="true"
        className={`relative grid h-14 w-14 place-items-center ${earned ? 'text-orange' : 'text-white/40'}`}
      >
        <BadgeArt className="absolute inset-0 h-full w-full" />
        <span className="font-heading text-h3 relative font-bold">
          {name.charAt(0).toUpperCase()}
        </span>
      </span>
      <span className="font-heading text-sm font-bold break-words">{name}</span>
      {detail && (
        <span className={`text-xs ${earned ? 'text-gray-100' : 'text-white/70'}`}>{detail}</span>
      )}
    </button>
  ),
);

BadgeTile.displayName = 'BadgeTile';
