import type { SanityImageSource } from '@sanity/image-url';
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
  | 'turnering'
  | 'finale'
  | 'laer-a-spille'
  | 'fri-spilling'
  | 'demo'
  | 'pause'
  | 'annet';

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

// Sessions come back in start order; editors may enter them in any order. A session without a
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
    sessions[] | order(start asc, room asc){
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
