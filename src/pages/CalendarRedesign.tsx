import { Link, useLoaderData } from 'react-router-dom';
import type { CalendarEventTypes } from '../sanity/queryHelpers/events';
import { CalendarTitleBand } from '../components/sections/redesign/CalendarTitleBand';
import { GameNightStrip } from '../components/sections/redesign/GameNightStrip';
import { SeasonBoard } from '../components/sections/redesign/SeasonBoard';
import { PosterGrid } from '../components/sections/redesign/UpcomingHighlights';
import { EventSignUp } from '../components/sections/redesign/EventSignUp';
import { SubscribeCalendar } from '../components/sections/redesign/SubscribeCalendar';
import { SectionHeading } from '../components/ui/SectionHeading';
import { buttonClasses } from '../components/ui/buttonClasses';
import { useAuth } from '../hooks/authContext/authContext';
import { useRsvp } from '../hooks/useRsvp';
import { memberPortalEnabled } from '../utils/featureFlags';
import {
  eventHighlights,
  isGameNight,
  upcomingEvents,
  visitorAttendance,
} from '../utils/eventHighlights';
import { seasonMonths } from '../utils/season';
import Info from '../assets/icons/symbols/info.svg?react';

/**
 * The new calendar overview (round 3, behind `redesignEnabled`). The rhythm first: game nights
 * as a row of dates. Then the season at a glance, then posters for the special events. Search,
 * the full list and the month grid live one click away on /kalender/alle.
 */
export default function CalendarRedesign() {
  const { events, eventsFailed } = useLoaderData() as {
    events: CalendarEventTypes[];
    eventsFailed: boolean;
  };
  const { isAuthenticated, user } = useAuth();
  const member = memberPortalEnabled && isAuthenticated && !!user;
  const now = new Date();
  const upcoming = upcomingEvents(events, now);
  const nights = upcoming.filter(isGameNight).slice(0, 5);
  const highlights = eventHighlights(events, now);
  const rsvp = useRsvp(member ? upcoming : []);
  const mineCount = member ? upcoming.filter((event) => rsvp.isAttending(event._id)).length : 0;

  return (
    <div className="dark:bg-darkestblue bg-white">
      <CalendarTitleBand
        title="Kalender"
        intro="Spillkveld annenhver torsdag. Turneringer, julespill og festivalen innimellom."
        actions={
          <>
            <SubscribeCalendar />
            {member && mineCount > 0 && (
              <Link
                to="/kalender/alle?kategori=mine"
                className={buttonClasses({
                  variant: 'tertiary',
                  size: 'lg',
                  className: 'border-2 border-white text-white',
                })}
              >
                Mine påmeldinger ({mineCount})
              </Link>
            )}
          </>
        }
      />
      {eventsFailed ? (
        <p
          role="alert"
          className="max-w-shell font-body text-darkestblue mx-auto px-4 py-10 text-lg sm:px-6 dark:text-white"
        >
          Vi fikk ikke hentet kalenderen akkurat nå. Prøv igjen om litt.
        </p>
      ) : (
        <>
          <GameNightStrip
            nights={nights}
            now={now}
            signUp={
              member ? (event) => <EventSignUp event={event} rsvp={rsvp} size="xs" /> : undefined
            }
          />
          <SeasonBoard
            months={seasonMonths(events, now)}
            isMine={member ? (event) => rsvp.isAttending(event._id) : undefined}
          />
          <section
            aria-labelledby="spesielle"
            className="max-w-shell mx-auto flex flex-col gap-6 px-4 py-10 sm:px-6 lg:py-12"
          >
            <SectionHeading
              id="spesielle"
              kicker="Sett av datoen"
              title="Spesielle arrangementer"
            />
            {highlights.length > 0 ? (
              <PosterGrid
                highlights={highlights}
                wideFestival
                attendance={(h) =>
                  member && h.event && !h.event.festivalDay
                    ? `${rsvp.attendeesOf(h.event._id).length} kommer`
                    : visitorAttendance(h)
                }
                actions={(h) =>
                  member && h.event && !h.event.festivalDay ? (
                    <EventSignUp event={h.event} rsvp={rsvp} size="md" />
                  ) : undefined
                }
              />
            ) : (
              <p className="font-body text-darkestblue dark:text-white">
                Ingen spesielle arrangementer er lagt inn ennå.
              </p>
            )}
            <p className="font-body text-darkestblue flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-current pt-4 text-sm dark:text-white">
              <Info aria-hidden="true" className="h-4 w-4 fill-current" />
              Leter du etter noe bestemt?
              <Link to="/kalender/alle" className="font-bold underline underline-offset-4">
                Søk i alle arrangementer
              </Link>
              <Link
                to="/kalender/alle?tidligere=vis"
                className="font-bold underline underline-offset-4"
              >
                Tidligere arrangementer
              </Link>
            </p>
          </section>
        </>
      )}
    </div>
  );
}
