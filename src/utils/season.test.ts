import { describe, expect, it } from 'vitest';
import type { CalendarEventTypes } from '../sanity/queryHelpers/events';
import { seasonMonths, seasonTickets } from './season';

function event(_id: string, start: string, end = start): CalendarEventTypes {
  return {
    _id,
    title: _id,
    category: 'spillkveld',
    eventStartTime: new Date(start),
    eventEndTime: new Date(end),
  };
}

describe('seasonMonths', () => {
  it('lays out eight Oslo months from now, across the new year, empty months included', () => {
    const now = new Date('2026-11-26T12:00:00Z');
    const months = seasonMonths(
      [
        event('past', '2026-11-12T16:00:00Z'),
        event('nov', '2026-11-26T16:00:00Z', '2026-11-26T22:30:00Z'),
        event('jan', '2027-01-14T16:00:00Z'),
        // 23:30 UTC on 31 January is 1 February in Oslo.
        event('feb', '2027-01-31T23:30:00Z'),
      ],
      now,
    );
    expect(months.map((m) => m.key)).toEqual([
      '2026-11',
      '2026-12',
      '2027-01',
      '2027-02',
      '2027-03',
      '2027-04',
      '2027-05',
      '2027-06',
    ]);
    expect(months[0].events.map((e) => e._id)).toEqual(['nov']);
    expect(months[1].events).toEqual([]);
    expect(months[2].events.map((e) => e._id)).toEqual(['jan']);
    expect(months[3].events.map((e) => e._id)).toEqual(['feb']);
    expect(months[2]).toMatchObject({ year: 2027, month: 0 });
  });
});

describe('seasonTickets', () => {
  it('folds a festival’s days into one ticket with a day range', () => {
    const festival = { slug: 'bgm', name: 'Board Game Masters' };
    const tickets = seasonTickets([
      event('night', '2027-01-14T16:00:00Z'),
      { ...event('bgm:1', '2027-01-29T16:00:00Z'), festivalDay: true, festival },
      { ...event('bgm:3', '2027-01-31T09:00:00Z'), festivalDay: true, festival },
    ]);
    expect(tickets.map((t) => [t.key, t.title, t.days])).toEqual([
      ['night', 'night', '14.'],
      ['festival:bgm', 'Board Game Masters', '29.–31.'],
    ]);
  });
});
