import Meeple from '../../assets/icons/symbols/meeple.svg?react';

/**
 * The membership card as a picture: name, season and club on a dark card with the brand dot
 * grid, tilted on an orange hard shadow. Decorative — the real card with its QR code lives in
 * Min side (`MembershipCardSection`) — so the whole face is `aria-hidden`.
 *
 * With no `name` it shows a dashed «Ditt navn» line to be filled in. `stamp` lays a rubber
 * stamp over it (Bli medlem's «Søkt» after sending).
 */
export function MembershipCardFace({
  name,
  season = new Date().getFullYear(),
  stamp,
}: {
  name: string;
  season?: number;
  stamp?: string;
}) {
  return (
    <div aria-hidden="true" className="max-w-aside relative w-full -rotate-2">
      <div className="bg-darkestblue dot-pattern shadow-accent-4 border-2 border-white p-5 text-white">
        <div className="flex min-h-44 flex-col gap-5">
          <div className="flex items-start justify-between">
            <span className="font-heading text-xs font-bold tracking-[0.18em] uppercase">
              Medlemskort {season}
            </span>
            <Meeple className="text-orange h-8 w-8 fill-current" />
          </div>
          {name ? (
            <p className="font-heading text-h2 font-bold break-words">{name}</p>
          ) : (
            <p className="font-heading text-h2 border-b-2 border-dashed border-white/50 pb-1 font-bold text-white/40">
              Ditt navn
            </p>
          )}
          <p className="font-body mt-auto text-sm text-white/70">Stavanger Brettspillklubb</p>
        </div>
      </div>
      {stamp && (
        <span className="font-heading border-success text-success absolute top-1/2 right-4 -translate-y-1/2 -rotate-[14deg] border-4 bg-white/90 px-3 py-1 text-2xl font-bold tracking-[0.12em] uppercase">
          {stamp}
        </span>
      )}
    </div>
  );
}

MembershipCardFace.displayName = 'MembershipCardFace';
