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
  participants: [],
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
  participants: [],
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
  participants: [],
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

/** The dataset the queries run against, in the same shape Sanity stores documents. */
export const DATASET = [
  UPCOMING_EVENT,
  UPCOMING_TOURNAMENT,
  PAST_EVENT,
  ...POSTS,
  HOME_HERO,
  CALENDAR_HERO,
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
