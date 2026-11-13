import { describe, expect, it } from 'vitest';
import { evaluate, parse } from 'groq-js';
import { CURRENT_BGM_QUERY, FESTIVAL_BY_SLUG_QUERY } from './festivals';
import { ARRANGEMENT_BY_SLUG_QUERY } from '../../loaders/festival-loader';

// The queries run against a small dataset with the real GROQ engine, so the edition choice and
// the projection's ordering and fallbacks are pinned without a live Sanity project.
const festival = (id: string, series: string, first: string, last: string, extra = {}) => ({
  _id: id,
  _type: 'festival',
  series,
  slug: { current: id },
  days: [
    { _key: `${id}-1`, date: first },
    { _key: `${id}-2`, date: last },
  ],
  ...extra,
});

const dataset = [
  festival('bgm-2026', 'bgm', '2026-01-30', '2026-02-01'),
  festival('bgm-2027', 'bgm', '2027-01-29', '2027-01-31', {
    days: [
      {
        _key: 'fre',
        date: '2027-01-29',
        sessions: [
          { _key: 's2', start: '14:00', end: '16:00', room: 'Sal A', gameName: 'Fritt spill' },
          { _key: 's1', start: '10:00', end: '12:00', game: { _ref: 'game-1' } },
        ],
      },
      { _key: 'son', date: '2027-01-31' },
    ],
  }),
  festival('bgm-2028', 'bgm', '2028-01-28', '2028-01-30'),
  festival('annet-2027', 'annet', '2027-01-01', '2027-01-02'),
  { _id: 'game-1', _type: 'game', title: 'Brass', playersMin: 2, playersMax: 4 },
  {
    _id: 'event-1',
    _type: 'event',
    title: 'Spillkveld',
    slug: { current: 'spillkveld' },
    hasDetailPage: true,
  },
  {
    _id: 'event-2',
    _type: 'event',
    title: 'Bare i kalenderen',
    slug: { current: 'kalender' },
    hasDetailPage: false,
  },
];

async function run<T>(query: string, params: Record<string, unknown>): Promise<T> {
  return (await (await evaluate(parse(query), { dataset, params })).get()) as T;
}

describe('CURRENT_BGM_QUERY', () => {
  it('picks the nearest edition that has not ended', async () => {
    const result = await run<{ _id: string }>(CURRENT_BGM_QUERY, { today: '2026-11-13' });
    expect(result._id).toBe('bgm-2027');
  });

  it('still shows an edition on its last day', async () => {
    const result = await run<{ _id: string }>(CURRENT_BGM_QUERY, { today: '2027-01-31' });
    expect(result._id).toBe('bgm-2027');
  });

  it('falls back to the most recent edition when every one has ended', async () => {
    const result = await run<{ _id: string }>(CURRENT_BGM_QUERY, { today: '2029-01-01' });
    expect(result._id).toBe('bgm-2028');
  });
});

describe('FESTIVAL_PROJECTION', () => {
  it('derives the date span, orders sessions and resolves the game', async () => {
    const result = await run<{
      startDate: string;
      endDate: string;
      days: { sessions?: { _key: string; game: unknown }[] }[];
    }>(FESTIVAL_BY_SLUG_QUERY, { slug: 'bgm-2027' });
    expect(result.startDate).toBe('2027-01-29');
    expect(result.endDate).toBe('2027-01-31');
    const sessions = result.days[0].sessions!;
    expect(sessions.map((s) => s._key)).toEqual(['s1', 's2']);
    expect(sessions[0].game).toEqual({ name: 'Brass', image: null, minPlayers: 2, maxPlayers: 4 });
    expect(sessions[1].game).toEqual({ name: 'Fritt spill' });
  });
});

describe('ARRANGEMENT_BY_SLUG_QUERY', () => {
  it('finds a festival by slug', async () => {
    const result = await run<{ event: unknown; festival: { _id: string } }>(
      ARRANGEMENT_BY_SLUG_QUERY,
      { slug: 'bgm-2027' },
    );
    expect(result.event).toBeNull();
    expect(result.festival._id).toBe('bgm-2027');
  });

  it('finds an event only when it has its own page', async () => {
    const page = await run<{ event: { _id: string } | null }>(ARRANGEMENT_BY_SLUG_QUERY, {
      slug: 'spillkveld',
    });
    expect(page.event?._id).toBe('event-1');
    const calendarOnly = await run<{ event: unknown; festival: unknown }>(
      ARRANGEMENT_BY_SLUG_QUERY,
      { slug: 'kalender' },
    );
    expect(calendarOnly).toEqual({ event: null, festival: null });
  });
});
