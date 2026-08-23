import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PortableText, toPlainText } from '@portabletext/react';
import { Button } from '../ui/Buttons';
import { Chip, type ChipCategory } from '../ui/Chip';
import { Input } from '../ui/Input';
import { Segmented } from '../ui/Segmented';
import { Select } from '../ui/Select';
import EmptyState from '../ui/EmptyState';
import { AvatarStack, type AvatarStackPerson } from '../ui/AvatarStack';
import { urlFor } from '../../sanity/sanityImageUrl';
import calendarPlaceholderImage from '../../assets/images/calendar-placeholder.png';
import ExpandIcon from '../../assets/icons/arrows/expand.svg?react';
import ArrowRight from '../../assets/icons/arrows/arrowright.svg?react';
import type { CalendarEventTypes } from '../../sanity/queryHelpers/events';
import type { CalendarHeroTypes } from '../../sanity/queryHelpers/calendar-hero';
import { components } from '../../sanity/editors/portableTextComponents';
import { useAuth } from '../../hooks/authContext/authContext';
import {
  createParticipantFromProfile,
  addParticipantToEvent,
  removeParticipantFromEvent,
  type CalendarEventParticipantTypes,
} from '../../sanity/queryHelpers/updateEventParticipants';

interface CalendarSectionProps {
  calendarHero?: CalendarHeroTypes;
  /** The fetch failed, as opposed to succeeding with nothing in it. See `calendarLoader`. */
  failed?: boolean;
  events: CalendarEventTypes[];
  /** Portal mode: a plain heading instead of the full navy hero band. */
  compact?: boolean;
}

const FALLBACK_CALENDAR = {
  title: 'Kalender',
  subtitle:
    'Her vil du finne oversikt over alle våre arrangementer fra ukentlige spillkvelder, til turneringer og andre events. ',
  imageUrl: calendarPlaceholderImage,
  imageSourceName: 'Designed by Freepik',
  imageSourceUrl: 'www.freepik.com',
};

const INTERNAL_ORIGIN = 'https://www.mamf92.github.io/sbsk-website';

// How many events past the featured one to render before "Last inn flere".
const PAGE_SIZE = 10;

type Category = CalendarEventTypes['category'];

// Category theming: spillkveld = blue, turnering = orange, annet = dark orange. `accent` is the
// shade-different companion fill, used by both the date block and the open panel.
//
// These are spelled out as whole class strings on purpose. Tailwind scans source text, so an
// assembled `bg-${category}` never reaches the stylesheet — which is exactly why the previous
// version of this file rendered its cards unstyled.
//
// `surfaceTone` is the `surface-*` utility matching the `surface` fill, kept separate because
// `surface` lands on the card root — the element that carries `lift-card` — and a `surface-*`
// there would repoint the card's own shadow onto the page instead of its children's onto the
// card. It goes on the header row inside, which is what the RSVP button actually casts onto.
// `accent` only ever fills non-lifting elements, so it carries its tone inline.
//
// `surfaceButtonVariant`/`accentButtonVariant` name which `Button` variant survives on top of
// that fill. `primary` is `bg-orange`, which is pixel-identical to `turnering`'s surface and to
// `annet`'s accent — a button in that spot vanishes into its own card. Same collision
// `PostsSection`'s `linkVariants` guards against for the news feed's orange-family panels.
const CATEGORY_STYLES = {
  // `bg-darkblue`, not `bg-category-spillkveld`. #88 repointed that token at orange so the
  // news feed's spillkveld chip would match its cards, which are orange there. The calendar
  // codes spillkveld navy (Calendar.jsx, and #87 spells it out) precisely so it reads apart
  // from turnering at a glance — on the news feed the two are aliases of one orange, which
  // is fine for a topic label and not fine for a list you scan for what kind of night it is.
  spillkveld: {
    surface: 'bg-darkblue text-white',
    surfaceTone: 'surface-dark',
    accent: 'bg-darkestblue surface-dark text-white',
    surfaceButtonVariant: 'primary',
    accentButtonVariant: 'primary',
  },
  turnering: {
    surface: 'bg-category-turnering text-darkestblue',
    surfaceTone: 'surface-light',
    accent: 'bg-darkorange surface-light text-darkestblue',
    surfaceButtonVariant: 'tertiary',
    accentButtonVariant: 'primary',
  },
  annet: {
    surface: 'bg-category-annet text-darkestblue',
    surfaceTone: 'surface-light',
    accent: 'bg-orange surface-light text-darkestblue',
    surfaceButtonVariant: 'primary',
    accentButtonVariant: 'tertiary',
  },
} as const;

const categoryStyles = (category: Category) =>
  CATEGORY_STYLES[category] ?? CATEGORY_STYLES.spillkveld;

const CATEGORY_FILTERS: { value: 'all' | Category; label: string; chip: ChipCategory }[] = [
  { value: 'all', label: 'Alle', chip: 'neutral' },
  { value: 'spillkveld', label: 'Spillkveld', chip: 'spillkveld' },
  { value: 'turnering', label: 'Turnering', chip: 'turnering' },
  { value: 'annet', label: 'Annet', chip: 'annet' },
];

type Scope = 'upcoming' | 'past' | 'all';

const SCOPE_OPTIONS: { value: Scope; label: string }[] = [
  { value: 'upcoming', label: 'Kommende' },
  { value: 'past', label: 'Tidligere' },
  { value: 'all', label: 'Alle' },
];

type Sort = 'date-asc' | 'date-desc' | 'title-asc';

const SORT_OPTIONS: { value: Sort; label: string }[] = [
  { value: 'date-asc', label: 'Dato (først → sist)' },
  { value: 'date-desc', label: 'Dato (sist → først)' },
  { value: 'title-asc', label: 'Tittel (A–Å)' },
];

/* -------------------------------------------------------------------------- */
/* Formatting                                                                  */
/* -------------------------------------------------------------------------- */

const LOCALE = 'no-NO';

/** "AUGUST 2026" — the month divider between groups. */
function monthLabel(date: Date): string {
  return date.toLocaleDateString(LOCALE, { month: 'long', year: 'numeric' }).toUpperCase();
}

/** Sorts and groups by real calendar month, not by the rendered label. */
function monthKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

/** "AUG". Sliced off the long name because the short one carries a trailing period. */
function monthAbbreviation(date: Date): string {
  return date.toLocaleDateString(LOCALE, { month: 'long' }).slice(0, 3).toUpperCase();
}

/** "Man" — likewise stripped of the abbreviating period. */
function weekdayAbbreviation(date: Date): string {
  const weekday = date.toLocaleDateString(LOCALE, { weekday: 'short' }).replace('.', '');
  return weekday.charAt(0).toUpperCase() + weekday.slice(1);
}

function clockTime(date: Date): string {
  return date.toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit', hour12: false });
}

/** "Man 18:00–22:00", widening to include both dates when the event runs past midnight. */
function timeRange(start: Date, end: Date): string {
  const sameDay = start.toDateString() === end.toDateString();
  if (sameDay) {
    return `${weekdayAbbreviation(start)} ${clockTime(start)}–${clockTime(end)}`;
  }

  // Without the year a range that crosses New Year reads as though it runs backwards
  // ("26. feb. – 25. jan."), so it is spelled out only in that case.
  const crossesYears = start.getFullYear() !== end.getFullYear();
  const dayAndMonth = (date: Date) =>
    date.toLocaleDateString(LOCALE, {
      day: 'numeric',
      month: 'short',
      ...(crossesYears ? { year: 'numeric' } : {}),
    });

  return (
    `${weekdayAbbreviation(start)} ${dayAndMonth(start)} ${clockTime(start)} – ` +
    `${weekdayAbbreviation(end)} ${dayAndMonth(end)} ${clockTime(end)}`
  );
}

/** Whole calendar days between two instants, ignoring the time of day. */
function daysBetween(from: Date, to: Date): number {
  const startOfDay = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  return Math.round((startOfDay(to) - startOfDay(from)) / 86400000);
}

function countdown(start: Date, now: Date): string {
  const days = daysBetween(now, start);
  if (days === 0) return 'I dag';
  if (days === 1) return 'I morgen';
  if (days > 0) return `Om ${days} dager`;
  return `${-days} dager siden`;
}

/* -------------------------------------------------------------------------- */
/* RSVP                                                                        */
/* -------------------------------------------------------------------------- */

function participantsByEvent(events: CalendarEventTypes[]) {
  return Object.fromEntries(events.map((event) => [event._id, event.participants ?? []]));
}

/**
 * Attendance for every event on the page, held in one place rather than per card, because the
 * "Mine kommende" filter has to see the same optimistic state the cards do.
 */
function useRsvp(events: CalendarEventTypes[]) {
  const { isAuthenticated, user } = useAuth();
  const [participants, setParticipants] = useState(() => participantsByEvent(events));
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  useEffect(() => {
    setParticipants(participantsByEvent(events));
  }, [events]);

  const attendeesOf = (eventId: string): CalendarEventParticipantTypes[] =>
    participants[eventId] ?? [];

  const isAttending = (eventId: string) =>
    !!user && attendeesOf(eventId).some((p) => p.supabase_id === user.supabase_id);

  async function toggle(eventId: string) {
    const supabaseId = user?.supabase_id;
    if (!user || !supabaseId || pending[eventId]) return;

    const previous = attendeesOf(eventId);
    const leaving = previous.some((p) => p.supabase_id === supabaseId);
    const participant = createParticipantFromProfile(user);

    setErrors((current) => ({ ...current, [eventId]: null }));
    setPending((current) => ({ ...current, [eventId]: true }));
    setParticipants((current) => ({
      ...current,
      [eventId]: leaving
        ? previous.filter((p) => p.supabase_id !== supabaseId)
        : [...previous, { _key: supabaseId, ...participant }],
    }));

    try {
      if (leaving) {
        await removeParticipantFromEvent({ eventId, supabaseId });
      } else {
        await addParticipantToEvent({ eventId, participant });
      }
    } catch (err) {
      console.error('Error updating event participation:', err);
      setParticipants((current) => ({ ...current, [eventId]: previous }));
      setErrors((current) => ({
        ...current,
        [eventId]: leaving
          ? 'Kunne ikke melde deg av arrangementet. Prøv igjen senere.'
          : 'Kunne ikke melde deg på arrangementet. Prøv igjen senere.',
      }));
    } finally {
      setPending((current) => ({ ...current, [eventId]: false }));
    }
  }

  return { loggedIn: isAuthenticated, attendeesOf, isAttending, toggle, pending, errors };
}

function toAvatarPeople(participants: CalendarEventParticipantTypes[]): AvatarStackPerson[] {
  return participants.map((participant) => ({
    name: [participant.name, participant.surname].filter(Boolean).join(' ').trim() || 'Medlem',
    src: participant.photo_url || undefined,
  }));
}

/* -------------------------------------------------------------------------- */
/* Section                                                                     */
/* -------------------------------------------------------------------------- */

export default function CalendarSection({
  calendarHero,
  events,
  compact,
  failed = false,
}: CalendarSectionProps) {
  return (
    <div className="flex flex-col items-center gap-2 py-6">
      {compact ? (
        <CompactHeading {...(calendarHero ?? {})} />
      ) : calendarHero ? (
        <CalendarHero {...calendarHero} />
      ) : (
        <CalendarHero />
      )}
      <EventList events={events} failed={failed} />
    </div>
  );
}

/** Portal mode — no image, and an h2 because the portal page owns the h1. */
function CompactHeading({ title, subtitle }: CalendarHeroTypes = {}) {
  return (
    <div className="max-w-content flex w-full flex-col gap-2 px-3 lg:px-0">
      <h2 className="font-heading text-h2 text-darkestblue tracking-heading font-bold dark:text-white">
        {title || FALLBACK_CALENDAR.title}
      </h2>
      <p className="font-body text-darkestblue dark:text-white">
        {subtitle || FALLBACK_CALENDAR.subtitle}
      </p>
    </div>
  );
}

function CalendarHero({
  title,
  subtitle,
  image,
  imageSourceName,
  imageSourceUrl,
}: CalendarHeroTypes = {}) {
  const resolvedTitle = title || FALLBACK_CALENDAR.title;
  const resolvedSubtitle = subtitle || FALLBACK_CALENDAR.subtitle;
  const resolvedImageSource = imageSourceName || FALLBACK_CALENDAR.imageSourceName;
  const resolvedImageSourceUrl = imageSourceUrl || FALLBACK_CALENDAR.imageSourceUrl;
  return (
    <div className="max-w-content flex w-full flex-col px-3 lg:px-0">
      <div className="relative">
        {image ? (
          <img
            src={urlFor(image).width(1440).fit('crop').url()}
            srcSet={[
              `${urlFor(image).width(400).fit('crop').url()} 400w`,
              `${urlFor(image).width(800).fit('crop').url()} 800w`,
              `${urlFor(image).width(1024).fit('crop').url()} 1024w`,
            ].join(', ')}
            sizes="(max-width: 400px) 400px, (max-width: 800px) 800px, 1024px"
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <img src={FALLBACK_CALENDAR.imageUrl} alt="" className="h-full w-full object-cover" />
        )}
        {resolvedImageSource && resolvedImageSourceUrl && (
          <div className="absolute right-4 bottom-2 flex flex-col">
            <a
              href={resolvedImageSourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-darkestblue/50 text-xs text-white underline sm:text-sm"
            >
              {resolvedImageSource}
            </a>
          </div>
        )}
      </div>
      <div className="bg-darkblue flex flex-col items-start gap-2 p-4 text-white sm:p-6">
        <h1 className="font-heading text-h1 tracking-heading font-bold">{resolvedTitle}</h1>
        <p className="font-body">{resolvedSubtitle}</p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* List                                                                        */
/* -------------------------------------------------------------------------- */

function EventList({ events, failed }: { events: CalendarEventTypes[]; failed?: boolean }) {
  const rsvp = useRsvp(events);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<'all' | Category>('all');
  const [scope, setScope] = useState<Scope>('upcoming');
  const [sort, setSort] = useState<Sort>('date-asc');
  const [onlyMine, setOnlyMine] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // One instant for the whole list, so the scope split, the next-event pick and the countdown
  // can never disagree with each other mid-render.
  const now = useMemo(() => new Date(), []);

  const nextEventId = useMemo(() => {
    const upcoming = events
      .filter((event) => new Date(event.eventEndTime) >= now)
      .sort((a, b) => new Date(a.eventStartTime).getTime() - new Date(b.eventStartTime).getTime());
    return upcoming.length ? upcoming[0]._id : null;
  }, [events, now]);

  const [expandedId, setExpandedId] = useState<string | null>(nextEventId);

  const filtered = events
    .filter((event) => category === 'all' || event.category === category)
    .filter((event) => {
      if (scope === 'all') return true;
      const ended = new Date(event.eventEndTime) < now;
      return scope === 'past' ? ended : !ended;
    })
    .filter((event) => !onlyMine || !rsvp.loggedIn || rsvp.isAttending(event._id))
    .filter((event) => {
      if (!query) return true;
      const haystack = [event.title, event.location ?? '', toPlainText(event.content ?? [])]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query.toLowerCase());
    });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'title-asc') {
      return a.title.localeCompare(b.title, ['no', 'sv', 'da'], { sensitivity: 'base' });
    }
    const aTime = new Date(a.eventStartTime).getTime();
    const bTime = new Date(b.eventStartTime).getTime();
    return sort === 'date-desc' ? bTime - aTime : aTime - bTime;
  });

  // The highlight only makes sense on an unfiltered, chronological "what's next" reading.
  const showsNext = scope === 'upcoming' && sort === 'date-asc' && !query && !onlyMine;
  const nextEvent = showsNext ? sorted.find((event) => event._id === nextEventId) : undefined;
  const rest = nextEvent ? sorted.filter((event) => event._id !== nextEvent._id) : sorted;
  const visible = rest.slice(0, visibleCount);

  const groups: { key: string; label: string; items: CalendarEventTypes[] }[] = [];
  for (const event of visible) {
    const start = new Date(event.eventStartTime);
    const key = monthKey(start);
    const group = groups.find((candidate) => candidate.key === key);
    if (group) group.items.push(event);
    else groups.push({ key, label: monthLabel(start), items: [event] });
  }

  function clearFilters() {
    setQuery('');
    setCategory('all');
    setScope('upcoming');
    setSort('date-asc');
    setOnlyMine(false);
    setVisibleCount(PAGE_SIZE);
  }

  if (events.length === 0) {
    return (
      <div className="max-w-content text-darkestblue mx-auto w-full dark:text-white">
        {/* An unreachable backend must not be reported as an empty programme — see PostsSection. */}
        {failed ? (
          <EmptyState
            title="Kunne ikke laste arrangementer"
            body="Vi fikk ikke kontakt med innholdstjenesten. Prøv å laste siden på nytt om et øyeblikk."
          />
        ) : (
          <EmptyState
            title="Ingen arrangementer"
            body="Det ser ikke ut til å være noen kommende arrangementer for øyeblikket. Vennligst sjekk igjen senere."
          />
        )}
      </div>
    );
  }

  return (
    <div className="max-w-content flex w-full flex-col gap-4 px-2 lg:px-0">
      <div className="flex justify-end">
        <Segmented
          label="Vis arrangementer"
          options={SCOPE_OPTIONS}
          value={scope}
          onChange={(value) => {
            setScope(value);
            setVisibleCount(PAGE_SIZE);
          }}
        />
      </div>

      <Input
        type="search"
        icon="search"
        aria-label="Søk etter arrangementer"
        placeholder="Søk etter arrangementer…"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setVisibleCount(PAGE_SIZE);
        }}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORY_FILTERS.map((filter) => (
            <Chip
              key={filter.value}
              category={filter.chip}
              active={category === filter.value}
              onClick={() => {
                setCategory(filter.value);
                setVisibleCount(PAGE_SIZE);
              }}
            >
              {filter.label}
            </Chip>
          ))}
          {rsvp.loggedIn && (
            <Chip
              className="normal-case"
              active={onlyMine}
              onClick={() => {
                setOnlyMine((value) => !value);
                setVisibleCount(PAGE_SIZE);
              }}
            >
              ★ Mine kommende
            </Chip>
          )}
        </div>

        <Select
          aria-label="Sorter arrangementer"
          options={SORT_OPTIONS}
          value={sort}
          onChange={(event) => setSort(event.target.value as Sort)}
        />
      </div>

      {nextEvent && (
        <div className="flex flex-col gap-3">
          <Divider>
            <span>Neste arrangement</span>
            <span>{countdown(new Date(nextEvent.eventStartTime), now)}</span>
          </Divider>
          <EventRow
            event={nextEvent}
            rsvp={rsvp}
            expanded={expandedId === nextEvent._id}
            onToggle={() => setExpandedId(expandedId === nextEvent._id ? null : nextEvent._id)}
          />
        </div>
      )}

      {groups.map((group) => (
        <div key={group.key} className="flex flex-col gap-3">
          <Divider>
            <span>{group.label}</span>
          </Divider>
          {group.items.map((event) => (
            <EventRow
              key={event._id}
              event={event}
              rsvp={rsvp}
              expanded={expandedId === event._id}
              onToggle={() => setExpandedId(expandedId === event._id ? null : event._id)}
            />
          ))}
        </div>
      ))}

      {sorted.length === 0 && (
        <EmptyState
          variant="inline"
          className="text-darkestblue dark:text-white"
          title={
            onlyMine && rsvp.loggedIn ? 'Ingen påmeldinger' : 'Ingen arrangementer matcher søket'
          }
          body={
            onlyMine && rsvp.loggedIn
              ? 'Du er ikke påmeldt noen kommende arrangementer ennå.'
              : 'Prøv et annet søk, eller fjern filtrene for å se alt.'
          }
          action={
            <Button variant="primary" size="lg" icon="backspace" onClick={clearFilters}>
              Fjern filtre
            </Button>
          }
        />
      )}

      {visibleCount < rest.length && (
        <div className="flex justify-center">
          <Button
            variant="primary"
            size="lg"
            onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
          >
            Last inn flere
          </Button>
        </div>
      )}
    </div>
  );
}

function Divider({ children }: { children: ReactNode }) {
  return (
    <div className="font-heading text-darkestblue tracking-heading flex items-baseline justify-between gap-3 border-b border-current pb-1.5 text-xs font-bold uppercase opacity-70 dark:text-white">
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Row                                                                         */
/* -------------------------------------------------------------------------- */

function EventRow({
  event,
  rsvp,
  expanded,
  onToggle,
}: {
  event: CalendarEventTypes;
  rsvp: ReturnType<typeof useRsvp>;
  expanded: boolean;
  onToggle: () => void;
}) {
  const navigate = useNavigate();
  const styles = categoryStyles(event.category);
  const start = new Date(event.eventStartTime);
  const end = new Date(event.eventEndTime);

  const detailPath = event.eventSlug ? `/arrangementer/${event.eventSlug}` : null;
  // The chevron is now driven by whether there is anything to open, not by the category —
  // a turnering with a description expands like any other event, and reaches its own page
  // through the "Se arrangementet" button in the panel.
  const expandable = !!event.content?.length || !!event.image || !!event.links?.length;
  // Nothing to open, but a page of its own: link straight out instead of expanding.
  const linksOut = !expandable && !!detailPath;

  const attendees = rsvp.attendeesOf(event._id);
  const attending = rsvp.isAttending(event._id);
  const error = rsvp.errors[event._id];
  const panelId = `event-panel-${event._id}`;

  return (
    <div
      data-event-id={event._id}
      data-expanded={expanded}
      className={[
        'w-full border border-black dark:border-white',
        styles.surface,
        expandable || linksOut ? 'lift-card' : '',
      ].join(' ')}
    >
      <div
        onClick={
          expandable ? onToggle : linksOut && detailPath ? () => navigate(detailPath) : undefined
        }
        className={[
          'flex min-h-27 items-stretch',
          styles.surfaceTone,
          expandable || linksOut ? 'cursor-pointer select-none' : '',
        ].join(' ')}
      >
        {/* Full-bleed date block — the number runs to the edges of its column. */}
        <div
          className={[
            'flex w-20 flex-none flex-col items-center justify-center p-1 sm:w-25',
            styles.accent,
          ].join(' ')}
        >
          <span className="font-heading sm:text-daymark text-5xl leading-[0.78] font-extrabold">
            {start.getDate()}
          </span>
          <span className="font-heading text-base font-bold tracking-[0.18em] uppercase">
            {monthAbbreviation(start)}
          </span>
        </div>

        <div className="relative flex flex-1 flex-wrap items-center gap-4 p-4 pr-12 sm:flex-nowrap sm:gap-5">
          <div className="flex min-w-0 flex-[1_1_100%] flex-col gap-1 sm:flex-1">
            <span className="font-body text-xs opacity-85">
              {timeRange(start, end)}
              {event.location ? ` · ${event.location}` : ''}
            </span>
            <h3 className="font-heading text-h3 font-bold">{event.title}</h3>
          </div>

          {/* Members-only. Kept as one block so avatars and the RSVP wrap together. */}
          {rsvp.loggedIn && (
            <div
              className="flex flex-[1_1_100%] flex-wrap items-center gap-3 sm:flex-none"
              onClick={(clickEvent) => clickEvent.stopPropagation()}
            >
              {attendees.length > 0 && (
                <AvatarStack people={toAvatarPeople(attendees)} max={3} size="sm" />
              )}
              <Button
                variant={attending ? 'toggle' : styles.surfaceButtonVariant}
                size="sm"
                disabled={rsvp.pending[event._id]}
                aria-label={attending ? `Meld deg av ${event.title}` : `Meld deg på ${event.title}`}
                onClick={() => rsvp.toggle(event._id)}
              >
                {attending ? 'Påmeldt!' : 'Bli med'}
              </Button>
            </div>
          )}

          {/* Absolute so it never claims a row of its own once the actions wrap. */}
          {expandable && (
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls={panelId}
              aria-label={expanded ? `Skjul ${event.title}` : `Vis mer om ${event.title}`}
              onClick={(clickEvent) => {
                clickEvent.stopPropagation();
                onToggle();
              }}
              className="focus-visible:outline-focus-ring absolute top-4 right-3 flex h-7 w-7 cursor-pointer items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:static sm:top-auto sm:right-auto"
            >
              <ExpandIcon
                className={[
                  'h-5 w-5 fill-current transition-transform duration-(--duration-base) ease-out',
                  expanded ? 'rotate-180' : 'rotate-0',
                ].join(' ')}
              />
            </button>
          )}

          {linksOut && detailPath && (
            <Link
              to={detailPath}
              aria-label={`Les mer om ${event.title}`}
              className="focus-visible:outline-focus-ring absolute top-4 right-3 flex h-7 w-7 items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:static sm:top-auto sm:right-auto"
            >
              <ArrowRight className="h-5 w-5 fill-current" />
            </Link>
          )}
        </div>
      </div>

      {error && (
        <p
          role="status"
          className="bg-darkestorange font-body border-t border-black p-2 text-center text-sm font-bold text-white dark:border-white"
        >
          {error}
        </p>
      )}

      {expandable && (
        <div id={panelId} hidden={!expanded}>
          <div
            className={[
              'flex flex-col gap-4 border-t border-black p-4 sm:p-6 dark:border-white',
              styles.accent,
            ].join(' ')}
          >
            {/* Same rich-text rhythm the news cards use — `.sbsk-rt` (src/index.css) owns the
                spacing *between* blocks; the Portable Text components own the type scale. */}
            {event.content && (
              <div className="sbsk-rt">
                <PortableText value={event.content} components={components} />
              </div>
            )}

            {event.image && (
              <img
                src={urlFor(event.image).width(1440).fit('crop').url()}
                srcSet={[
                  `${urlFor(event.image).width(400).fit('crop').url()} 400w`,
                  `${urlFor(event.image).width(800).fit('crop').url()} 800w`,
                  `${urlFor(event.image).width(1024).fit('crop').url()} 1024w`,
                ].join(', ')}
                sizes="(max-width: 400px) 400px, (max-width: 800px) 800px, 1024px"
                alt=""
                className="h-84 w-full border border-black object-cover lg:h-100 dark:border-white"
              />
            )}

            {(event.links?.length || detailPath) && (
              <div className="flex flex-row flex-wrap gap-2">
                {detailPath && (
                  <Button
                    variant={styles.accentButtonVariant}
                    size="sm"
                    icon="right"
                    onClick={() => navigate(detailPath)}
                  >
                    Se arrangementet
                  </Button>
                )}
                {event.links?.map((link, index) => {
                  const isInternal = link.url.startsWith(INTERNAL_ORIGIN);
                  return (
                    <Button
                      key={index}
                      variant={styles.accentButtonVariant}
                      size="sm"
                      icon="right"
                      onClick={() =>
                        isInternal
                          ? navigate(new URL(link.url, window.location.href).pathname)
                          : window.open(link.url, '_blank', 'noopener,noreferrer')
                      }
                    >
                      {link.label}
                    </Button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
