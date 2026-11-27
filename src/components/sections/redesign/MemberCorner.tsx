import { Link } from 'react-router-dom';
import type { MemberHome } from '../../../hooks/useMemberHome';
import { MembershipCardFace } from '../../ui/MembershipCardFace';
import { StatTile } from '../../ui/StatTile';
import { buttonClasses } from '../../ui/buttonClasses';
import { TextLink } from '../../ui/TextLink';
import { badgeText } from '../../../content/badges';
import { orderBadges } from '../../../utils/badges';
import { currentSeason } from '../../../utils/membership';
import BadgeArt from '../../../assets/icons/badges/badge.svg?react';

/**
 * The signed-in member's band in place of «Tre trekk»: the membership card with this season's
 * payment, their own numbers and their newest badges. Each links on to Min side, which holds the
 * full versions; this is the glance.
 */
export function MemberCorner({ name, home }: { name: string; home: MemberHome | null }) {
  const season = currentSeason();
  const badges = orderBadges(
    (home?.badges ?? []).filter((badge) => badge.awarded_at || badge.kind === 'auto'),
  );
  const earned = badges.filter((badge) => badge.awarded_at);
  const shown = badges.slice(0, 5);
  const dash = (value: number | null | undefined) =>
    value === null || value === undefined ? '–' : value;
  return (
    <section
      aria-labelledby="ditt-medlemskap"
      className="bg-cream dark:bg-darkblue border-b border-black dark:border-white/20"
    >
      <h2 id="ditt-medlemskap" className="sr-only">
        Ditt medlemskap
      </h2>
      <div className="max-w-shell mx-auto grid items-start gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="flex flex-col items-start gap-7">
          <MembershipCardFace
            name={name}
            season={season}
            stamp={home?.paid ? 'Betalt' : undefined}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/medlemsportal" className={buttonClasses({ variant: 'primary', size: 'md' })}>
              Min side
            </Link>
            <Link
              to="/medlemsportal/medlemskort"
              className={buttonClasses({ variant: 'tertiary', size: 'md' })}
            >
              Vis medlemskortet
            </Link>
          </div>
          {home?.paid === false && (
            <p className="font-body text-darkestblue text-sm dark:text-white">
              Kontingenten for {season} er ikke registrert som betalt ennå.
            </p>
          )}
        </div>

        <div className="text-darkestblue surface-light flex flex-col gap-5 dark:text-white">
          <div className="grid grid-cols-3 gap-2">
            <StatTile
              tone="light"
              value={dash(home?.activity.checkIns)}
              label="Kvelder"
              size="sm"
            />
            <StatTile tone="light" value={dash(home?.activity.signups)} label="Påmeldt" size="sm" />
            <StatTile
              tone="light"
              value={home?.badges ? earned.length : '–'}
              label="Merker"
              size="sm"
            />
          </div>
          {shown.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="font-heading tracking-heading flex items-baseline justify-between gap-3 border-b border-current pb-1.5 text-xs font-bold uppercase opacity-80">
                <span>Dine merker</span>
                <span className="tracking-normal normal-case">
                  <TextLink to="/medlemsportal">Alle merker</TextLink>
                </span>
              </div>
              <ul className="flex flex-wrap gap-4">
                {shown.map((badge) => {
                  const name = badgeText(badge.slug).name.nb;
                  return (
                    <li
                      key={badge.slug}
                      className={`flex w-20 flex-col items-center gap-1.5 text-center ${
                        badge.awarded_at ? '' : 'opacity-40'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`relative grid size-14 place-items-center ${
                          badge.awarded_at ? 'text-orange' : 'text-gray-500 dark:text-white/60'
                        }`}
                      >
                        <BadgeArt className="absolute inset-0 h-full w-full" />
                        <span className="font-heading text-h3 text-darkestblue relative font-bold">
                          {name.charAt(0)}
                        </span>
                      </span>
                      <span className="font-body text-xs font-bold">
                        {name}
                        {!badge.awarded_at && <span className="sr-only"> (ikke oppnådd ennå)</span>}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
