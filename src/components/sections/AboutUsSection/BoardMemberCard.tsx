import { initials } from '../../../utils/initials';

export interface BoardMemberCardProps {
  name: string;
  role?: string;
  bio?: string;
  imageUrl?: string;
}

/**
 * A person, not a link: the same `bg-surface` card frame as the rest of the site, with no hover
 * and nothing to press (docs/DESIGN_LANGUAGE.md).
 *
 * `min-h-44` and a half-width image column: the grid this sits in (`AboutUsSection`) floors
 * each card at 290px wide, and 290/176 lands the card close to the 2:1 the design handoff asks
 * for, where a half-width column reads as a square portrait rather than the narrow vertical
 * strip `w-2/5` used to produce. That ratio only holds at the floor, though — the image column
 * is `items-stretch`, tracking whatever height the text column actually needs, not `min-h-44`
 * itself. An unbounded bio stretches the card (and with it, the fixed-proportion image) into a
 * tall narrow strip the same way an unbounded subtitle did in `Card.tsx`'s thumbnail before that
 * was given `h-full`. There, the photo is meant to keep growing with the text. Here the portrait
 * is meant to read as a person, not an unpredictable rectangle, so `line-clamp-3` on the bio
 * bounds the card's height instead — keeping every card close to the 2:1 the image column was
 * actually designed around, at the cost of truncating a long bio rather than growing to fit it.
 */
export function BoardMemberCard({ name, role, bio, imageUrl }: BoardMemberCardProps) {
  return (
    <article className="border-border bg-surface text-fg shadow-card flex min-h-44 items-stretch border">
      <div className="flex min-w-0 flex-1 flex-col gap-1 p-4">
        <h3 className="font-heading text-heading text-h3 font-bold">{name}</h3>
        {role ? (
          <span className="text-fg-muted text-xs font-bold tracking-[0.06em] uppercase">
            {role}
          </span>
        ) : null}
        {bio ? <p className="font-body mt-1 line-clamp-3 text-sm">{bio}</p> : null}
      </div>
      <div className="w-1/2 shrink-0">
        {imageUrl ? (
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span
            aria-hidden="true"
            className="font-heading text-h2 bg-surface-muted text-heading flex h-full w-full items-center justify-center font-bold"
          >
            {initials(name)}
          </span>
        )}
      </div>
    </article>
  );
}
