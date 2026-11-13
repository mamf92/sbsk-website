import type { Page } from '@playwright/test';
import { evaluate, parse } from 'groq-js';

// A Sanity stand-in for the e2e suite: fixture *documents*, with the app's own GROQ queries run
// over them.
//
// Every other stub in this suite fulfils Sanity with `{"result": []}`. That is a real state worth
// testing, but it is not the one visitors see, and it skips the code that matters: `[].map(...)`
// renders nothing, and PostsSection and CalendarSection return their empty state before touching
// a single field. Under an empty stub these pages cannot fail — which is how #160 shipped a page
// that crashed on every real event while CI stayed green.
//
// The obvious fix — hand-written response fixtures — only moves the blind spot. A fixture that
// hardcodes the response is not evidence about the query: rename a field in the projection and
// the fixture happily keeps serving the old shape. So instead this evaluates the query string the
// app actually sent, with groq-js, against documents shaped like real Sanity documents. The
// response is then produced the same way the real API produces it, and both directions of drift
// show up: a component reading a field the projection never returns, and a projection that stops
// returning a field the page still reads.
//
// Unit tests cannot reach this seam at all — they hand-build props typed as `CalendarEventTypes`,
// which proves a component renders a given shape, not that any query produces it.

/** Dates are relative to run time so the fixtures never expire into the past. */
function daysFromNow(days: number, hour: number, minute = 0): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  date.setUTCHours(hour, minute, 0, 0);
  return date.toISOString();
}

function block(key: string, text: string) {
  return {
    _type: 'block',
    _key: key,
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', _key: `${key}-span`, text, marks: [] }],
  };
}

function slug(current: string) {
  return { _type: 'slug', current };
}

export const UPCOMING_EVENT = {
  _id: 'event-upcoming',
  _type: 'event',
  title: 'Spillkveld, torsdag',
  slug: slug('spillkveld-torsdag'),
  publishedAt: daysFromNow(-20, 9),
  eventStartTime: daysFromNow(7, 15),
  eventEndTime: daysFromNow(7, 21, 30),
  category: 'spillkveld',
  location: 'Byhaugkafeen, Stavanger',
  content: [block('b1', 'Åpen spillkveld for alle som vil være med.')],
  links: [{ _key: 'link-1', label: 'Facebook-gruppa', url: 'https://example.test/fb' }],
  // Content-flagged as having its own page — see eventType.ts's `hasDetailPage`. Without this,
  // neither /arrangementer nor the calendar row links out to /arrangementer/spillkveld-torsdag.
  hasDetailPage: true,
  signup: {
    method: 'spond',
    url: 'https://spond.com/landing/event/test',
    label: { nb: 'Meld deg på spillkvelden' },
    price: { nb: 'Gratis for medlemmer' },
  },
  venue: {
    name: 'Byhaugkafeen',
    address: 'Byhaugveien 1, 4021 Stavanger',
    doorsOpen: '17:30',
    meetingPoint: { nb: 'Inngangen ved parkeringen' },
  },
  showSponsors: true,
  sponsors: [
    {
      _key: 's1',
      altText: 'Hovedsponsoren',
      tier: 'hovedsponsor',
      link: 'https://example.test/hoved',
    },
    { _key: 's2', altText: 'Partneren', tier: 'partner' },
  ],
};

export const UPCOMING_TOURNAMENT = {
  _id: 'event-tournament',
  _type: 'event',
  title: 'Høstturnering',
  slug: slug('hostturnering'),
  publishedAt: daysFromNow(-20, 9),
  eventStartTime: daysFromNow(21, 10),
  eventEndTime: daysFromNow(21, 17),
  category: 'turnering',
  location: 'Tasta bydelshus, Stavanger',
  content: [block('b2', 'Turnering i puljer gjennom dagen.')],
};

export const PAST_EVENT = {
  _id: 'event-past',
  _type: 'event',
  title: 'Spillkveld i forrige måned',
  slug: slug('spillkveld-forrige-maned'),
  publishedAt: daysFromNow(-50, 9),
  eventStartTime: daysFromNow(-30, 15),
  eventEndTime: daysFromNow(-30, 21, 30),
  category: 'spillkveld',
  location: 'Byhaugkafeen, Stavanger',
  content: [block('b3', 'En kveld som allerede har vært.')],
};

export const POSTS = [
  {
    _id: 'post-news',
    _type: 'post',
    title: 'Høstprogrammet er klart',
    subtitle: 'Spillkvelder annenhver torsdag fra september.',
    slug: slug('hostprogrammet'),
    publishedAt: daysFromNow(-2, 9),
    category: 'nyheter',
    content: [block('b4', 'Vi er klare for en ny sesong med spillkvelder.')],
    links: [{ _key: 'link-1', label: 'Se kalenderen', url: 'https://example.test/kalender' }],
  },
  {
    _id: 'post-report',
    _type: 'post',
    title: 'Fullt hus på siste spillkveld',
    subtitle: 'Sju bord i sving hele kvelden.',
    slug: slug('fullt-hus'),
    publishedAt: daysFromNow(-9, 9),
    category: 'spillkveldrapporter',
    content: [block('b5', 'Det ble en av de bedre kveldene i vår.')],
  },
  {
    _id: 'post-event',
    _type: 'post',
    title: 'Turneringen trenger frivillige',
    subtitle: 'Vi ser etter noen som kan hjelpe til.',
    slug: slug('trenger-frivillige'),
    publishedAt: daysFromNow(-16, 9),
    category: 'arrangementer',
    content: [block('b6', 'Meld fra i Facebook-gruppa hvis du kan ta en vakt.')],
    relatedEvent: { _type: 'reference', _ref: 'festival-bgm' },
  },
];

export const HOME_HERO = {
  _id: 'home-hero',
  _type: 'homeHero',
  title: 'Stavanger Brettspillklubb',
  subtitle: 'Vi møtes annenhver torsdag.',
  links: [{ _key: 'link-1', label: 'Bli medlem', url: 'https://example.test/bli-medlem' }],
};

export const CALENDAR_HERO = {
  _id: 'calendar-hero',
  _type: 'calendarHero',
  title: 'Kalender',
  subtitle: 'Oversikt over alle våre arrangementer.',
};

export const GAMES_HERO = {
  _id: 'games-hero',
  _type: 'gamesHero',
  title: 'Våre spill',
  subtitle: 'Spillene klubben eier, klare til å bli tatt med på en spillkveld.',
};

// Titles deliberately do not collide with `FALLBACK_GAMES` in OurGamesSection, so a spec can
// assert the real Sanity content is what rendered, not the hardcoded fallback underneath it.
export const GAME_LIGHT = {
  _id: 'game-testkveld',
  _type: 'game',
  title: 'Testkveld',
  genre: 'Familie · Terningspill',
  description: 'Et lett spill for hele gjengen.',
  difficulty: 1,
  time: '20',
  players: '2–4',
  playersMin: 2,
  playersMax: 4,
};

export const GAME_HEAVY = {
  _id: 'game-storgruppe',
  _type: 'game',
  title: 'Storgruppe',
  genre: 'Strategi · Områdekontroll',
  description: 'Et tyngre spill for en stor gjeng.',
  difficulty: 3,
  time: '90–120',
  players: '5–8',
  playersMin: 5,
  playersMax: 8,
};

export const GAMES = [GAME_LIGHT, GAME_HEAVY];

export const ABOUT_PAGE = {
  _id: 'about-page',
  _type: 'aboutPage',
  clubTitle: 'Om Stavanger Brettspillklubb',
  clubIntro: 'Klubben samler brettspillentusiaster i hele regionen.',
  clubBody: ['Vi møtes annenhver torsdag på Byhaugkafeen.'],
  boardTitle: 'Styret vårt',
  boardIntro: 'Frivillige som driver klubben fremover.',
};

// Names deliberately do not collide with `FALLBACK_BOARD` in AboutUsSection, so a spec can
// assert the real Sanity members are what rendered, not the hardcoded fallback underneath it.
export const BOARD_MEMBER = {
  _id: 'board-member-1',
  _type: 'boardMember',
  name: 'Turid Vik',
  role: 'Leder',
  bio: 'Har sittet i styret siden klubben startet.',
  order: 1,
};

/** A date `days` from today as Sanity stores a `date` field: "YYYY-MM-DD". */
function dateFromNow(days: number): string {
  return daysFromNow(days, 12).slice(0, 10);
}

export const FESTIVAL_BGM = {
  _id: 'festival-bgm',
  _type: 'festival',
  series: 'bgm',
  edition: 'XIX',
  title: { nb: 'Board Game Masters', en: 'Board Game Masters' },
  slug: slug('board-game-masters-test'),
  tagline: { nb: 'Tre dager med turneringer og fri spilling.', en: 'Three days of tournaments.' },
  venue: { name: 'Tasta bydelshus', address: 'Tastaveden 2, Stavanger' },
  signup: {
    method: 'spond',
    url: 'https://spond.com/landing/event/bgm',
    price: { nb: '200 kr for alle dager' },
  },
  days: [
    {
      _key: 'fre',
      date: dateFromNow(30),
      opens: '17:00',
      closes: '23:00',
      label: { nb: 'Åpningskveld' },
      sessions: [
        {
          _key: 's-catan',
          start: '18:00',
          end: '21:00',
          format: 'turnering',
          title: { nb: 'Innledende runder: Catan', en: 'Qualifiers: Catan' },
          room: 'Sal A',
          seats: 32,
        },
        {
          _key: 's-learn',
          start: '18:00',
          end: '19:00',
          format: 'laer-a-spille',
          title: { nb: 'Lær å spille Azul' },
          room: 'Sal B',
        },
        {
          _key: 's-free',
          start: '19:00',
          end: '23:00',
          format: 'fri-spilling',
          title: { nb: 'Fri spilling' },
        },
      ],
    },
    {
      _key: 'lor',
      date: dateFromNow(31),
      opens: '10:00',
      closes: '22:00',
      sessions: [
        {
          _key: 's-final',
          start: '14:00',
          end: '17:00',
          format: 'finale',
          title: { nb: 'Finale: Catan' },
        },
      ],
    },
    { _key: 'son', date: dateFromNow(32), opens: '11:00', closes: '18:00' },
  ],
  faq: [
    {
      _key: 'faq-1',
      question: { nb: 'Må jeg kunne spillene fra før?' },
      answer: { nb: [block('faq-1-a', 'Nei, vi har egne økter for å lære.')] },
    },
  ],
  contactEmail: 'styret@example.test',
};

/**
 * An event an editor (or an API write) filled with hostile URLs. Not in `DATASET`: the spec that
 * needs it adds it. Every link here must be dropped, never rendered as an `href`.
 */
export const MALICIOUS_EVENT = {
  _id: 'event-malicious',
  _type: 'event',
  title: 'Arrangement med farlige lenker',
  slug: slug('farlige-lenker'),
  publishedAt: daysFromNow(-1, 9),
  eventStartTime: daysFromNow(10, 15),
  eventEndTime: daysFromNow(10, 20),
  category: 'annet',
  hasDetailPage: true,
  content: [
    {
      _type: 'block',
      _key: 'm1',
      style: 'normal',
      markDefs: [{ _type: 'link', _key: 'bad', url: 'javascript:alert(1)' }],
      children: [{ _type: 'span', _key: 'm1-span', text: 'Klikk her', marks: ['bad'] }],
    },
  ],
  links: [{ _key: 'l1', label: 'Farlig knapp', url: 'javascript:alert(2)' }],
  signup: { method: 'lenke', url: 'javascript:alert(3)', label: { nb: 'Meld deg på' } },
  showSponsors: true,
  sponsors: [
    {
      _key: 'bad-sponsor',
      altText: 'Farlig sponsor',
      tier: 'partner',
      link: 'data:text/html,<script>alert(4)</script>',
    },
  ],
};

/** The dataset the queries run against, in the same shape Sanity stores documents. */
export const DATASET = [
  UPCOMING_EVENT,
  UPCOMING_TOURNAMENT,
  PAST_EVENT,
  FESTIVAL_BGM,
  ...POSTS,
  HOME_HERO,
  CALENDAR_HERO,
  GAMES_HERO,
  ...GAMES,
  ABOUT_PAGE,
  BOARD_MEMBER,
];

/**
 * @sanity/client sends the query and its parameters as URL parameters, falling back to a POST body
 * when the query is long enough to risk the URL limit. Parameter values arrive JSON-encoded.
 */
function requestQuery(url: URL, postData: string | null) {
  const body = postData ? (JSON.parse(postData) as { query?: string; params?: object }) : null;
  const query = url.searchParams.get('query') ?? body?.query ?? '';

  const params: Record<string, unknown> = { ...body?.params };
  for (const [name, value] of url.searchParams) {
    if (name.startsWith('$')) params[name.slice(1)] = JSON.parse(value);
  }

  return { query, params };
}

/** Answers every Sanity data query by running it, for real, over `DATASET`. */
export async function stubSanityWithContent(page: Page, dataset: unknown[] = DATASET) {
  await page.route('**://*.sanity.io/**', async (route) => {
    const url = new URL(route.request().url());

    // Image assets, not data. Nothing here references one, but a stray request must not be
    // answered with JSON.
    if (!url.pathname.includes('/data/query/')) return route.abort();

    const { query, params } = requestQuery(url, route.request().postData());
    const result = await (await evaluate(parse(query), { dataset, params })).get();

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ result }),
    });
  });
}

/**
 * Answers every Sanity query with an empty result. For specs whose subject is not the content —
 * the portals, the dialog — where what matters is that the shell reaches for no network.
 */
export async function stubSanityEmpty(page: Page) {
  await page.route('**://*.sanity.io/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ result: [] }),
    }),
  );
}
