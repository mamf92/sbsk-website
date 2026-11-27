import { useLoaderData } from 'react-router-dom';
import type { HomeRedesignData } from '../loaders/home-redesign-loader';
import { NextEventHero } from '../components/sections/redesign/NextEventHero';
import { NewcomerPath } from '../components/sections/redesign/NewcomerPath';
import { NoticeBoard } from '../components/sections/redesign/NoticeBoard';
import { PosterGrid } from '../components/sections/redesign/UpcomingHighlights';
import { MemberCorner } from '../components/sections/redesign/MemberCorner';
import { SectionHeading } from '../components/ui/SectionHeading';
import { TextLink } from '../components/ui/TextLink';
import { EventSignUp } from '../components/sections/redesign/EventSignUp';
import { useAuth } from '../hooks/authContext/authContext';
import { useRsvp } from '../hooks/useRsvp';
import { useMemberHome } from '../hooks/useMemberHome';
import { useUnreadPosts } from '../hooks/useUnreadPosts';
import { memberPortalEnabled } from '../utils/featureFlags';
import {
  eventHighlights,
  nextGameNight,
  upcomingEvents,
  visitorAttendance,
} from '../utils/eventHighlights';
import type { CalendarEventTypes } from '../sanity/queryHelpers/events';

/**
 * The new front page (round 3, behind `redesignEnabled`). Answers the first question most
 * visitors have, «when can I just come?», before anything else: the next game night is the hero.
 * Then the way in for newcomers, the club's notice board, and the special events to plan for.
 *
 * A signed-in member sees the same page with their own state swapped in: a greeting and sign-up
 * on the hero, their card, numbers and badges instead of «Tre trekk», «Ny» on unread posts, and
 * sign-up with who is coming on the posters.
 */
export default function HomeRedesign() {
  const { homeHero, posts, postsFailed, events } = useLoaderData() as HomeRedesignData;
  const { isAuthenticated, user } = useAuth();
  const member = memberPortalEnabled && isAuthenticated && !!user;
  const now = new Date();
  const next = nextGameNight(events, now);
  const later = upcomingEvents(events, now)
    .filter((event) => event !== next)
    .slice(0, 3);
  const highlights = eventHighlights(events, now).slice(0, 3);

  const rsvpEvents = [next, ...highlights.map((h) => h.event)].filter(
    (event): event is CalendarEventTypes => !!event && !event.festivalDay,
  );
  const rsvp = useRsvp(member ? rsvpEvents : []);
  const home = useMemberHome();
  const isNew = useUnreadPosts(member);
  const firstName = user?.name?.trim() || home?.me?.name || '';
  const fullName = [user?.name, user?.surname].filter(Boolean).join(' ').trim();

  const checkIns = home?.activity.checkIns;
  const sticker =
    checkIns === null || checkIns === undefined
      ? 'Velkommen tilbake!'
      : checkIns === 0
        ? 'Første kveld? Velkommen!'
        : `Kveld nr. ${checkIns + 1} for deg!`;

  return (
    <div className="dark:bg-darkestblue bg-white">
      <h1 className="sr-only">Stavanger Brettspillklubb</h1>
      <NextEventHero
        next={next}
        later={later}
        photo={homeHero?.image}
        now={now}
        member={
          member
            ? {
                eyebrow:
                  next?.category === 'spillkveld'
                    ? 'Din neste spillkveld'
                    : 'Ditt neste arrangement',
                greeting: firstName ? (
                  <p className="font-heading text-orange -mb-2 text-xl font-bold">
                    Hei, {firstName}!
                  </p>
                ) : null,
                actions:
                  next && !next.festivalDay ? (
                    <div className="pt-2">
                      <EventSignUp event={next} rsvp={rsvp} size="lg" />
                    </div>
                  ) : null,
                sticker,
              }
            : undefined
        }
      />
      {member ? <MemberCorner name={fullName} home={home} /> : <NewcomerPath />}
      <NoticeBoard posts={posts} failed={postsFailed} isNew={isNew} />
      {highlights.length > 0 && (
        <section
          aria-labelledby="hoydepunkter"
          className="max-w-shell mx-auto flex flex-col gap-6 px-4 py-10 sm:px-6 lg:py-12"
        >
          <SectionHeading
            id="hoydepunkter"
            kicker="Sett av datoen"
            title="Kommende høydepunkter"
            action={
              <span className="text-darkestblue dark:text-white">
                <TextLink to="/kalender">Hele kalenderen</TextLink>
              </span>
            }
          />
          <PosterGrid
            highlights={highlights}
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
        </section>
      )}
    </div>
  );
}
