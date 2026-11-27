import type { ReactNode } from 'react';

/**
 * A photo as a print on cream with a hard shadow, tilted: how the new pages show one picture on
 * a navy band, rather than a full-bleed image. `caption` writes on the print's wide bottom edge;
 * without one the frame is even all round.
 */
export function Polaroid({
  children,
  caption,
  className = '',
}: {
  children: ReactNode;
  caption?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-cream text-darkestblue tilt-right-lg relative border border-black p-3 shadow-[10px_10px_0_var(--color-darkestblue)] ${
        caption ? 'pb-14' : ''
      } ${className}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden border border-black">{children}</div>
      {caption && (
        <span className="font-heading absolute bottom-4 left-4 -rotate-1 text-lg font-bold">
          {caption}
        </span>
      )}
    </div>
  );
}

Polaroid.displayName = 'Polaroid';
