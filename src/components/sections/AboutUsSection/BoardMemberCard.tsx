import { initials } from '../../../utils/initials';

export interface BoardMemberCardProps {
  name: string;
  role?: string;
  bio?: string;
  imageUrl?: string;
}

/**
 * A flat, non-pressable rectangle — per "Who lifts" in `docs/DESIGN_LANGUAGE.md`, a card you
 * cannot press keeps its border and nothing else, so this takes no `lift-card` and no shadow.
 *
 * `--color-darkestorange` (#b75f04) is the fill, not `darkorange`: white on `darkorange` fails
 * AA for body text (3.33:1, see the design doc's "Foreground on fill"), while white on
 * `darkestorange` measures 4.51:1. `CalendarSection`'s day-mark footer already pairs the same
 * two colours.
 *
 * `min-h-44` (not the taller `min-h-56` this started as) and a half-width image column: the
 * grid this sits in (`AboutUsSection`) floors each card at 290px wide, and 290/176 lands the
 * card close to the 2:1 the design handoff asks for. At that ratio a half-width column is close
 * to as tall as it is wide, so the portrait/initials placeholder reads as a square instead of
 * the narrow vertical strip `w-2/5` produced. Still `min-h`, not a fixed `aspect-ratio` — a
 * long bio can push the card taller without clipping, same reasoning `Card.tsx`'s thumbnail
 * comment documents for avoiding an aspect-ratio-off-a-stretched-row feedback loop.
 */
export function BoardMemberCard({ name, role, bio, imageUrl }: BoardMemberCardProps) {
  return (
    <article className="bg-darkestorange flex min-h-44 items-stretch border border-black text-white dark:border-white">
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="font-heading text-h3 font-bold">{name}</h3>
        {role ? (
          <span className="text-xs font-bold tracking-[0.06em] uppercase">{role}</span>
        ) : null}
        {bio ? <p className="font-body mt-1 text-sm">{bio}</p> : null}
      </div>
      <div className="w-1/2 shrink-0">
        {imageUrl ? (
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span
            aria-hidden="true"
            className="text-darkblue font-heading text-h2 flex h-full w-full items-center justify-center bg-gray-100 font-bold"
          >
            {initials(name)}
          </span>
        )}
      </div>
    </article>
  );
}
