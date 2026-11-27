import { useLoaderData } from 'react-router-dom';
import type { HomeRedesignData } from '../loaders/home-redesign-loader';
import { NextEventHero } from '../components/sections/redesign/NextEventHero';
import { NewcomerPath } from '../components/sections/redesign/NewcomerPath';
import { NoticeBoard } from '../components/sections/redesign/NoticeBoard';
import { PosterGrid } from '../components/sections/redesign/UpcomingHighlights';
import { MemberCorner } from '../components/sections/redesign/MemberCorner';
import { SectionHeading } from '../components/ui/SectionHeading';
import { TextLink } from '../components/ui/TextLink';
import { RsvpButton } from '../components/ui/RsvpButton';
import { AvatarStack } from '../components/ui/AvatarStack';
import { useAuth } from '../hooks/authContext/authContext';
import { toAvatarPeople, useRsvp } from '../hooks/useRsvp';
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

  function signUp(event: CalendarEventTypes, size: 'md' | 'lg') {
    const attending = rsvp.isAttending(event._id);
    const attendees = rsvp.attendeesOf(event._id);
    const hidden = attendees.filter((a) => a.hidden).length;
    return (
      <div className={`flex flex-wrap items-center gap-3 ${size === 'md' ? 'flex-col' : ''}`}>
        <RsvpButton
          attending={attending}
          joinLabel={size === 'lg' ? 'Jeg kommer' : 'Meld meg på'}
          attendingLabel={size === 'lg' ? 'Du kommer' : 'Påmeldt!'}
          leaveLabel="Meld av"
          ariaLabel={attending ? `Meld av ${event.title}` : `Meld på ${event.title}`}
          size={size}
          disabled={rsvp.pending[event._id]}
          onClick={() => rsvp.toggle(event._id)}
        />
        {attendees.length > 0 && (
          <span className="font-body flex items-center gap-2 text-sm">
            <AvatarStack
              people={toAvatarPeople(attendees)}
              hiddenCount={hidden}
              max={5}
              size="xs"
            />
            {attendees.length} kommer
          </span>
        )}
        {rsvp.errors[event._id] && (
          <p role="alert" className="font-body w-full text-sm">
            {rsvp.errors[event._id]}
          </p>
        )}
      </div>
    );
  }

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
                    <div className="pt-2">{signUp(next, 'lg')}</div>
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
              member && h.event && !h.event.festivalDay ? signUp(h.event, 'md') : undefined
            }
          />
        </section>
      )}
    </div>
  );
}
