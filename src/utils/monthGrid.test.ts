import { describe, expect, it } from 'vitest';
import type { CalendarEventTypes } from '../sanity/queryHelpers/events';
import {
  eventsByDay,
  monthKey,
  monthTitle,
  monthWeeks,
  osloDay,
  parseDayKey,
  parseMonthKey,
} from './monthGrid';

describe('monthWeeks', () => {
  it('covers January 2027 in Monday-first weeks', () => {
    const weeks = monthWeeks(2027, 0);
    // 1 January 2027 is a Friday, so the first row starts on Monday 28 December.
    expect(weeks[0][0].key).toBe('2026-12-28');
    expect(weeks[0][4].key).toBe('2027-01-01');
    expect(weeks.at(-1)?.at(-1)?.key).toBe('2027-01-31');
    expect(weeks).toHaveLength(5);
  });
});

describe('parsing the URL', () => {
  it('accepts real days and months only', () => {
    expect(parseDayKey('2027-01-30')?.weekday).toBe(5);
    expect(parseDayKey('2027-02-30')).toBeNull();
    expect(parseDayKey('jul')).toBeNull();
    expect(parseMonthKey('2027-01')).toEqual({ y: 2027, m: 0 });
    expect(parseMonthKey('2027-13')).toBeNull();
  });

  it('rolls month keys over the year', () => {
    expect(monthKey(2026, 12)).toBe('2027-01');
    expect(monthKey(2027, -1)).toBe('2026-12');
    expect(monthTitle(2027, 0)).toBe('Januar 2027');
  });
});

describe('osloDay and eventsByDay', () => {
  it('use the Oslo date, not UTC', () => {
    expect(osloDay(new Date('2026-12-31T23:30:00Z')).key).toBe('2027-01-01');
    const late = {
      _id: 'late',
      title: 'late',
      category: 'spillkveld',
      eventStartTime: new Date('2027-01-31T23:30:00Z'),
      eventEndTime: new Date('2027-02-01T01:00:00Z'),
    } as CalendarEventTypes;
    expect([...eventsByDay([late]).keys()]).toEqual(['2027-02-01']);
  });
});
