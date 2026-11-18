import { describe, expect, it } from 'vitest';
import { evaluate, parse } from 'groq-js';
import {
  ADMIN_EVENT_BY_ID_QUERY,
  ADMIN_EVENTS_BETWEEN_QUERY,
  ADMIN_UPCOMING_EVENTS_QUERY,
} from './admin-events';

// Run the real queries with groq-js over documents shaped like the dataset's, so a renamed
// field or a broken ordering fails here rather than as an empty admin panel.
const documents = [
  {
    _id: 'past',
    _type: 'event',
    title: 'Spillkveld i fjor',
    category: 'spillkveld',
    eventStartTime: '2026-11-01T17:00:00Z',
    eventEndTime: '2026-11-01T22:00:00Z',
  },
  {
    _id: 'today',
    _type: 'event',
    title: 'Spillkveld',
    category: 'spillkveld',
    location: 'Tasta bydelshus',
    eventStartTime: '2026-11-18T17:00:00Z',
    eventEndTime: '2026-11-18T22:00:00Z',
    slug: { current: 'spillkveld' },
  },
  {
    _id: 'later',
    _type: 'event',
    title: 'Turnering',
    category: 'turnering',
    eventStartTime: '2026-12-05T10:00:00Z',
    eventEndTime: '2026-12-05T18:00:00Z',
    venue: { name: 'Biblioteket' },
    hasDetailPage: true,
  },
  {
    _id: 'bgm',
    _type: 'festival',
    title: { nb: 'Board Game Masters XIX', en: 'Board Game Masters XIX' },
    slug: { current: 'bgm-xix' },
    days: [
      { _key: 'd1', date: '2026-11-20', venue: { name: 'Tasta bydelshus' } },
      { _key: 'd2', date: '2026-11-22' },
    ],
  },
  { _id: 'post', _type: 'post', title: 'Not an event' },
];

async function run(query: string, params: Record<string, unknown>) {
  return (await evaluate(parse(query), { dataset: documents, params })).get();
}

describe('admin event queries', () => {
  it('lists upcoming events and festivals in start order, ongoing ones included', async () => {
    const rows = await run(ADMIN_UPCOMING_EVENTS_QUERY, {
      from: '2026-11-18T19:00:00Z',
      fromDate: '2026-11-18',
    });
    expect(rows.map((r: { _id: string }) => r._id)).toEqual(['today', 'bgm', 'later']);
    expect(rows[1]).toMatchObject({
      _type: 'festival',
      start: '2026-11-20',
      end: '2026-11-22',
      category: 'festival',
      location: 'Tasta bydelshus',
      slug: 'bgm-xix',
      hasDetailPage: true,
    });
    expect(rows[2]).toMatchObject({ location: 'Biblioteket', hasDetailPage: true });
    expect(rows[0]).toMatchObject({ location: 'Tasta bydelshus', hasDetailPage: false });
  });

  it('finds the events in a check-in window', async () => {
    const rows = await run(ADMIN_EVENTS_BETWEEN_QUERY, {
      from: '2026-11-18T00:00:00Z',
      to: '2026-11-26T00:00:00Z',
      fromDate: '2026-11-18',
      toDate: '2026-11-26',
    });
    expect(rows.map((r: { _id: string }) => r._id)).toEqual(['today', 'bgm']);
  });

  it('fetches one event or festival by id, and nothing else', async () => {
    expect(await run(ADMIN_EVENT_BY_ID_QUERY, { id: 'bgm' })).toMatchObject({
      title: 'Board Game Masters XIX',
    });
    expect(await run(ADMIN_EVENT_BY_ID_QUERY, { id: 'post' })).toBeNull();
  });
});
