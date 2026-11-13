import type { SanityImageSource } from '@sanity/image-url';
import type { LoaderFunctionArgs } from 'react-router-dom';
import { client } from '../client';
import { osloDateKey } from '../../utils/eventDateFormat';
import { EVENT_BY_SLUG_QUERY, type CalendarEventTypes } from './events';
import {
  SIGNUP_PROJECTION,
  SPONSOR_PROJECTION,
  VENUE_PROJECTION,
  type LocaleBlock,
  type LocaleString,
  type LocaleText,
  type SignupTypes,
  type SponsorTypes,
  type VenueTypes,
} from './fragments';

export type SessionFormat =
  'turnering' | 'finale' | 'laer-a-spille' | 'fri-spilling' | 'demo' | 'pause' | 'annet';

export interface FestivalSessionTypes {
  _key: string;
  /** "HH:MM", Oslo time, on the day's date. */
  start: string;
  end: string;
  title?: LocaleString;
  format?: SessionFormat;
  room?: string;
  seats?: number;
  level?: 'nybegynner' | 'alle' | 'erfaren';
  description?: LocaleText;
  signup?: SignupTypes | null;
  /** A sponsor's `altText` on the same festival. */
  sponsor?: string;
  game?: {
    name?: string;
    image?: SanityImageSource;
    minPlayers?: number;
    maxPlayers?: number;
  } | null;
}

export interface FestivalDayTypes {
  _key: string;
  /** "YYYY-MM-DD". */
  date: string;
  label?: LocaleString;
  opens?: string;
  closes?: string;
  summary?: LocaleText;
  venue?: VenueTypes | null;
  signup?: SignupTypes | null;
  sessions?: FestivalSessionTypes[];
}

export interface FestivalTypes {
  _id: string;
  title?: LocaleString;
  series?: 'bgm' | 'annet';
  edition?: string;
  slug: string;
  tagline?: LocaleText;
  heroImage?: (SanityImageSource & { alt?: string }) | null;
  intro?: LocaleBlock;
  startDate?: string;
  endDate?: string;
  days?: FestivalDayTypes[];
  signup?: SignupTypes | null;
  pricing?: LocaleBlock;
  venue?: VenueTypes | null;
  sponsors?: SponsorTypes[];
  faq?: { _key: string; question?: LocaleString; answer?: LocaleBlock }[];
  rules?: LocaleBlock;
  contactEmail?: string;
  gallery?: (SanityImageSource & { _key: string; alt?: string })[];
}

// Sessions come back in start order (rooms are ordered in `groupByStart`, with Norwegian collation); editors may enter them in any order. A session without a
// `game` reference falls back to the free-text name.
export const FESTIVAL_PROJECTION = `{
  _id,
  title,
  series,
  edition,
  "slug": slug.current,
  tagline,
  heroImage,
  intro,
  "startDate": days[0].date,
  "endDate": days[-1].date,
  days[]{
    _key,
    date,
    label,
    opens,
    closes,
    summary,
    venue${VENUE_PROJECTION},
    signup${SIGNUP_PROJECTION},
    sessions[] | order(start asc){
      _key,
      start,
      end,
      title,
      format,
      room,
      seats,
      level,
      description,
      signup${SIGNUP_PROJECTION},
      sponsor,
      "game": coalesce(
        game->{ "name": title, image, "minPlayers": playersMin, "maxPlayers": playersMax },
        select(defined(gameName) => { "name": gameName })
      )
    }
  },
  signup${SIGNUP_PROJECTION},
  pricing,
  venue${VENUE_PROJECTION},
  sponsors[]${SPONSOR_PROJECTION},
  faq[]{ _key, question, answer },
  rules,
  contactEmail,
  gallery
}`;

export const FESTIVAL_BY_SLUG_QUERY = `*[_type == "festival" && slug.current == $slug][0]${FESTIVAL_PROJECTION}`;

/**
 * The Board Game Masters edition `/board-game-masters` shows: the nearest one that has not
 * ended, else the most recent. `$today` is the Oslo date from the client (`osloDateKey`), not
 * GROQ's `now()`, which is UTC and a datetime.
 */
export const CURRENT_BGM_QUERY = `coalesce(
  *[_type == "festival" && series == "bgm" && days[-1].date >= $today] | order(days[0].date asc)[0],
  *[_type == "festival" && series == "bgm" && defined(days[0].date)] | order(days[0].date desc)[0]
)${FESTIVAL_PROJECTION}`;

// One round trip for both kinds of page under /arrangementer/:slug, composed from the two
// single-kind queries so each keeps one definition of what may have a page.
export const ARRANGEMENT_BY_SLUG_QUERY = `{
  "event": ${EVENT_BY_SLUG_QUERY},
  "festival": ${FESTIVAL_BY_SLUG_QUERY}
}`;

export type ArrangementData =
  { kind: 'event'; event: CalendarEventTypes } | { kind: 'festival'; festival: FestivalTypes };

/** `/arrangementer/:id`: an event with its own page, or a festival. 404 when neither. */
export async function arrangementLoader({ params }: LoaderFunctionArgs): Promise<ArrangementData> {
  const slug = params.id;
  if (!slug) throw new Response('Missing slug', { status: 400 });

  const result = await client.fetch<{
    event: CalendarEventTypes | null;
    festival: FestivalTypes | null;
  }>(ARRANGEMENT_BY_SLUG_QUERY, { slug });

  // Studio keeps slugs unique across both types; if that is ever bypassed, the festival wins,
  // since it is the bigger page and the one people are sent to.
  if (result?.festival) return { kind: 'festival', festival: result.festival };
  if (result?.event) return { kind: 'event', event: result.event };
  throw new Response('Not found', { status: 404 });
}

/**
 * `/board-game-masters`: the current edition, or `null` until one is published, in which case
 * the page keeps its placeholder. Never a 404: the footer links here.
 */
export async function boardGameMastersLoader(): Promise<{ festival: FestivalTypes | null }> {
  let festival: FestivalTypes | null;
  try {
    festival = await client.fetch<FestivalTypes | null>(CURRENT_BGM_QUERY, {
      today: osloDateKey(new Date()),
    });
  } catch (error) {
    // The nav links here: a Sanity outage shows the placeholder, not the error page.
    console.error('Board Game Masters query failed:', error);
    return { festival: null };
  }
  // Anything but a document (a malformed answer, or a stub's blanket `[]`) is "no edition yet".
  return {
    festival: festival && typeof festival === 'object' && '_id' in festival ? festival : null,
  };
}

/** The calendar's view of a festival: one row per day, built by `festivalDayRows`. */
export interface FestivalCalendarTypes {
  _id: string;
  title?: LocaleString;
  slug: string;
  series?: 'bgm' | 'annet';
  venue?: { name?: string } | null;
  days?: Pick<FestivalDayTypes, '_key' | 'date' | 'label' | 'opens' | 'closes'>[];
}

export const FESTIVAL_CALENDAR_QUERY = `*[_type == "festival" && defined(slug.current)]{
  _id,
  title,
  "slug": slug.current,
  series,
  venue{ name },
  days[]{ _key, date, label, opens, closes }
}`;

export async function calendarFestivalsLoader(): Promise<FestivalCalendarTypes[]> {
  const festivals = await client.fetch<FestivalCalendarTypes[] | null>(FESTIVAL_CALENDAR_QUERY);
  return Array.isArray(festivals) ? festivals : [];
}

/** What the home page teaser needs about the next festival. */
export interface FestivalTeaserTypes {
  _id: string;
  title?: LocaleString;
  slug: string;
  edition?: string;
  tagline?: LocaleText;
  heroImage?: (SanityImageSource & { alt?: string }) | null;
  startDate: string;
  endDate: string;
}

/**
 * The festival the home page points to: one that is running, or starts within `$until` (an
 * Oslo date about 60 days out). Dates compare as "YYYY-MM-DD" strings.
 */
export const UPCOMING_FESTIVAL_QUERY = `*[
  _type == "festival"
  && defined(slug.current)
  && days[-1].date >= $today
  && days[0].date <= $until
] | order(days[0].date asc)[0]{
  _id,
  title,
  "slug": slug.current,
  edition,
  tagline,
  heroImage,
  "startDate": days[0].date,
  "endDate": days[-1].date
}`;

const TEASER_DAYS = 60;

export async function upcomingFestivalLoader(
  now = new Date(),
): Promise<FestivalTeaserTypes | null> {
  const until = new Date(now.getTime() + TEASER_DAYS * 86_400_000);
  const festival = await client.fetch<FestivalTeaserTypes | null>(UPCOMING_FESTIVAL_QUERY, {
    today: osloDateKey(now),
    until: osloDateKey(until),
  });
  return festival && typeof festival === 'object' && '_id' in festival ? festival : null;
}
