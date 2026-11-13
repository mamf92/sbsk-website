// Run as a visitor in New York would: every assertion is about Oslo time, so a runtime zone that
// is neither Oslo nor UTC is what proves nothing reads the device zone.
process.env.TZ = 'America/New_York';

import { describe, expect, it } from 'vitest';
import type {
  FestivalDayTypes,
  FestivalSessionTypes,
  FestivalTypes,
} from '../sanity/queryHelpers/festivals';
import { buildIcsCalendar } from './ics';
import {
  dayDateTimes,
  defaultDayIndex,
  festivalDayRows,
  festivalIcs,
  festivalScopeId,
  groupByStart,
  nowAndNext,
  osloTime,
  parseFestivalScopeId,
  sessionDateTimes,
} from './festival';

const session = (
  _key: string,
  start: string,
  end: string,
  room?: string,
): FestivalSessionTypes => ({ _key, start, end, room });

describe('osloTime', () => {
  it('reads a winter wall clock as UTC+1', () => {
    expect(osloTime('2027-01-29', '18:00').toISOString()).toBe('2027-01-29T17:00:00.000Z');
  });

  it('reads a summer wall clock as UTC+2', () => {
    expect(osloTime('2027-06-12', '18:00').toISOString()).toBe('2027-06-12T16:00:00.000Z');
  });

  it('is right on the day summer time starts and ends', () => {
    // 28 March 2027: clocks go 02:00 → 03:00. 31 October 2027: 03:00 → 02:00.
    expect(osloTime('2027-03-28', '12:00').toISOString()).toBe('2027-03-28T10:00:00.000Z');
    expect(osloTime('2027-10-31', '12:00').toISOString()).toBe('2027-10-31T11:00:00.000Z');
  });

  it('crosses midnight UTC without slipping a day', () => {
    expect(osloTime('2027-01-30', '00:30').toISOString()).toBe('2027-01-29T23:30:00.000Z');
  });
});

describe('sessionDateTimes and dayDateTimes', () => {
  it('puts a session on its day', () => {
    const { start, end } = sessionDateTimes({ date: '2027-01-29' }, session('a', '10:00', '12:30'));
    expect(start.toISOString()).toBe('2027-01-29T09:00:00.000Z');
    expect(end.toISOString()).toBe('2027-01-29T11:30:00.000Z');
  });

  it('runs a session past midnight into the next day', () => {
    const { start, end } = sessionDateTimes({ date: '2027-01-29' }, session('a', '22:00', '02:00'));
    expect(start.toISOString()).toBe('2027-01-29T21:00:00.000Z');
    expect(end.toISOString()).toBe('2027-01-30T01:00:00.000Z');
  });

  it('gives opening hours only when both ends are set', () => {
    const day: FestivalDayTypes = { _key: 'd1', date: '2027-01-29', opens: '10:00' };
    expect(dayDateTimes(day)).toBeNull();
    expect(dayDateTimes({ ...day, closes: '23:00' })?.end.toISOString()).toBe(
      '2027-01-29T22:00:00.000Z',
    );
  });
});

describe('defaultDayIndex', () => {
  const festival = {
    days: [
      { _key: 'fre', date: '2027-01-29' },
      { _key: 'lor', date: '2027-01-30' },
      { _key: 'son', date: '2027-01-31' },
    ],
  };

  it('opens on today while the festival runs, by the Oslo date', () => {
    // 23:30 UTC on the 29th is already the 30th in Oslo.
    expect(defaultDayIndex(festival, new Date('2027-01-29T23:30:00Z'))).toBe(1);
  });

  it('stays on a night that runs past midnight while its doors are open', () => {
    const late = {
      days: [
        { _key: 'fre', date: '2027-01-29', opens: '18:00', closes: '02:00' },
        { _key: 'lor', date: '2027-01-30', opens: '10:00', closes: '23:00' },
      ],
    };
    // 00:30 Oslo on the 30th: Friday's doors are still open.
    expect(defaultDayIndex(late, new Date('2027-01-29T23:30:00Z'))).toBe(0);
    // 03:00 Oslo: Friday has closed, so Saturday by date.
    expect(defaultDayIndex(late, new Date('2027-01-30T02:00:00Z'))).toBe(1);
  });

  it('opens on the first day before and after the festival', () => {
    expect(defaultDayIndex(festival, new Date('2026-12-01T12:00:00Z'))).toBe(0);
    expect(defaultDayIndex(festival, new Date('2027-02-10T12:00:00Z'))).toBe(0);
    expect(defaultDayIndex({}, new Date())).toBe(0);
  });
});

describe('nowAndNext', () => {
  const day: FestivalDayTypes = {
    _key: 'lor',
    date: '2027-01-30',
    sessions: [
      session('a', '10:00', '12:00'),
      session('b', '11:00', '13:00'),
      session('c', '14:00', '16:00'),
      session('d', '13:00', '14:00'),
    ],
  };

  it('marks every session that is on, and the earliest one still to start', () => {
    // 11:30 Oslo.
    expect(nowAndNext(day, new Date('2027-01-30T10:30:00Z'))).toEqual({
      nowKeys: ['a', 'b'],
      nextKey: 'd',
    });
  });

  it('treats the end as exclusive', () => {
    // 12:00 Oslo: a has just ended.
    expect(nowAndNext(day, new Date('2027-01-30T11:00:00Z')).nowKeys).toEqual(['b']);
  });

  it('marks a session past midnight as on, and nothing before the doors open', () => {
    const night: FestivalDayTypes = {
      _key: 'fre',
      date: '2027-01-29',
      opens: '18:00',
      closes: '02:00',
      sessions: [session('n', '22:00', '01:00')],
    };
    expect(nowAndNext(night, new Date('2027-01-29T23:30:00Z')).nowKeys).toEqual(['n']);
    expect(nowAndNext(night, new Date('2027-01-29T12:00:00Z'))).toEqual({ nowKeys: [] });
  });

  it('marks nothing on another day', () => {
    expect(nowAndNext(day, new Date('2027-01-29T10:30:00Z'))).toEqual({ nowKeys: [] });
  });

  it('has no next after the last session has started', () => {
    expect(nowAndNext(day, new Date('2027-01-30T14:30:00Z'))).toEqual({
      nowKeys: ['c'],
      nextKey: undefined,
    });
  });
});

describe('groupByStart', () => {
  it('groups by start time, in time order, rooms sorted within a group', () => {
    const groups = groupByStart([
      session('x', '12:00', '13:00', 'Sal B'),
      session('y', '10:00', '11:00'),
      session('z', '12:00', '14:00', 'Sal A'),
    ]);
    expect(groups.map((group) => [group.start, group.sessions.map((s) => s._key)])).toEqual([
      ['10:00', ['y']],
      ['12:00', ['z', 'x']],
    ]);
  });
});

describe('festival scope ids', () => {
  it('round-trips a day and a session', () => {
    expect(parseFestivalScopeId(festivalScopeId('d1'))).toEqual({ dayKey: 'd1' });
    expect(parseFestivalScopeId(festivalScopeId('d1', 's9'))).toEqual({
      dayKey: 'd1',
      sessionKey: 's9',
    });
  });

  it('refuses keys that would make the path ambiguous', () => {
    expect(() => festivalScopeId('')).toThrow();
    expect(() => festivalScopeId('a/b')).toThrow();
    expect(() => festivalScopeId('a', 'b/c')).toThrow();
  });

  it('rejects malformed ids', () => {
    expect(parseFestivalScopeId(null)).toBeNull();
    expect(parseFestivalScopeId('')).toBeNull();
    expect(parseFestivalScopeId('a/')).toBeNull();
    expect(parseFestivalScopeId('a/b/c')).toBeNull();
  });
});

describe('festivalIcs', () => {
  const festival: FestivalTypes = {
    _id: 'bgm-2027',
    slug: 'bgm-2027',
    title: { nb: 'Board Game Masters 2027' },
    venue: { name: 'Tasta bydelshus', address: 'Tastaveden 2' },
    days: [
      {
        _key: 'fre',
        date: '2027-01-29',
        sessions: [
          {
            _key: 's1',
            start: '18:00',
            end: '22:00',
            title: { nb: 'Åpningsturnering', en: 'Opening tournament' },
            room: 'Sal A',
          },
          { _key: 's2', start: '19:00', end: '21:00', game: { name: 'Brass' } },
        ],
      },
      { _key: 'lor', date: '2027-01-30', opens: '10:00', closes: '23:00' },
      { _key: 'son', date: '2027-01-31' },
    ],
  };

  it('makes one entry per session, with stable ids from the Sanity keys', () => {
    const entries = festivalIcs(festival, 'en', 'https://example.org/bgm');
    expect(entries.map((entry) => entry.uid)).toEqual([
      'bgm-2027-fre-s1',
      'bgm-2027-fre-s2',
      'bgm-2027-lor',
    ]);
    expect(entries[0]).toMatchObject({
      title: 'Opening tournament · Board Game Masters 2027',
      location: 'Sal A, Tasta bydelshus, Tastaveden 2',
      url: 'https://example.org/bgm',
    });
    expect(entries[0].start.toISOString()).toBe('2027-01-29T17:00:00.000Z');
    expect(entries[1].title).toBe('Brass · Board Game Masters 2027');
  });

  it('names an untitled session after the festival once, not twice', () => {
    const untitled: FestivalTypes = {
      ...festival,
      days: [{ _key: 'd', date: '2027-01-29', sessions: [session('p', '12:00', '12:30')] }],
    };
    expect(festivalIcs(untitled, 'nb')[0].title).toBe('Board Game Masters 2027');
  });

  it('makes a day without sessions one entry for its opening hours, and skips a day with neither', () => {
    const entries = festivalIcs(festival, 'nb');
    expect(entries[2]).toMatchObject({ title: 'Board Game Masters 2027', uid: 'bgm-2027-lor' });
    expect(entries).toHaveLength(3);
  });

  it('builds one calendar holding every entry', () => {
    const ics = buildIcsCalendar(festivalIcs(festival, 'nb'));
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(3);
    expect(ics).toContain('UID:bgm-2027-fre-s1@sbsk.no');
  });
});

describe('festivalDayRows', () => {
  const festival = {
    _id: 'bgm-2027',
    slug: 'bgm-2027',
    title: { nb: 'Board Game Masters' },
    venue: { name: 'Tasta bydelshus' },
    days: [
      {
        _key: 'fre',
        date: '2027-01-29',
        opens: '17:00',
        closes: '23:00',
        label: { nb: 'Åpningskveld' },
      },
      { _key: 'lor', date: '2027-01-30', opens: '10:00', closes: '02:00' },
      { _key: 'son', date: '2027-01-31' },
      { _key: 'bad', date: 'snart' },
    ],
  };

  it('makes one calendar row per day, linking to that day of the programme', () => {
    const rows = festivalDayRows(festival);
    expect(rows.map((row) => row._id)).toEqual(['bgm-2027:fre', 'bgm-2027:lor', 'bgm-2027:son']);
    expect(rows.map((row) => row.detailPath)).toEqual([
      '/arrangementer/bgm-2027?dag=1',
      '/arrangementer/bgm-2027?dag=2',
      '/arrangementer/bgm-2027?dag=3',
    ]);
    expect(rows[0]).toMatchObject({
      title: 'Board Game Masters – Åpningskveld',
      category: 'turnering',
      location: 'Tasta bydelshus',
      festivalDay: true,
    });
  });

  it('keeps ?dag=N pointing at the right day when an earlier day is skipped', () => {
    const rows = festivalDayRows({
      ...festival,
      days: [festival.days[0], { _key: 'bad', date: 'snart' }, festival.days[2]],
    });
    expect(rows.map((row) => row.detailPath)).toEqual([
      '/arrangementer/bgm-2027?dag=1',
      '/arrangementer/bgm-2027?dag=3',
    ]);
  });

  it('files a festival outside the BGM series under «annet»', () => {
    const [row] = festivalDayRows({ ...festival, series: 'annet' });
    expect(row.category).toBe('annet');
  });

  it('names an unlabelled day by its date, and times the row by the doors', () => {
    const [, saturday, sunday] = festivalDayRows(festival);
    expect(saturday.title).toBe('Board Game Masters – lørdag 30. januar');
    expect(new Date(saturday.eventStartTime).toISOString()).toBe('2027-01-30T09:00:00.000Z');
    // Closing at 02:00 is the next morning.
    expect(new Date(saturday.eventEndTime).toISOString()).toBe('2027-01-31T01:00:00.000Z');
    // No hours: the whole day.
    expect(new Date(sunday.eventStartTime).toISOString()).toBe('2027-01-30T23:00:00.000Z');
  });
});
