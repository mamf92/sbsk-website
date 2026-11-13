// Run these as a visitor in New York would see them: every assertion is about Oslo time, so a
// runtime zone that is not Oslo (and not UTC, which CI uses) is what proves the zone is
// pinned. Set before any Date is created in this file.
process.env.TZ = 'America/New_York';

import { describe, expect, it } from 'vitest';
import {
  clockTime,
  dayLabel,
  dayOfMonth,
  monthAbbreviation,
  osloDateKey,
  osloDaysBetween,
  parseInstant,
  timeRange,
  weekdayAbbreviation,
} from './eventDateFormat';
import { monthKey } from './groupByMonth';

describe('event dates are shown in Oslo time, whatever the runtime zone', () => {
  it('runs under a foreign runtime zone', () => {
    // 17:00 UTC is 12:00 in New York in January. If this fails the TZ override did not apply
    // and the rest of the file proves nothing.
    expect(new Date('2027-01-29T17:00:00Z').getHours()).toBe(12);
  });

  it('clockTime reads Oslo time', () => {
    expect(clockTime(new Date('2027-01-29T17:00:00Z'))).toBe('18:00');
    // Summer time: UTC+2.
    expect(clockTime(new Date('2027-06-01T16:30:00Z'))).toBe('18:30');
  });

  it('osloDateKey uses the Oslo calendar date', () => {
    // 23:30 UTC on the 29th is already the 30th in Oslo, and still the 29th in New York.
    expect(osloDateKey(new Date('2027-01-29T23:30:00Z'))).toBe('2027-01-30');
    expect(dayOfMonth(new Date('2027-01-29T23:30:00Z'))).toBe(30);
  });

  it('weekday and month follow the Oslo date', () => {
    // Saturday 30 January in Oslo; Friday in New York.
    const date = new Date('2027-01-29T23:30:00Z');
    expect(weekdayAbbreviation(date)).toBe('Lør');
    expect(monthAbbreviation(new Date('2027-01-31T23:30:00Z'))).toBe('FEB');
  });

  it('timeRange treats an evening that is one Oslo day as one day', () => {
    // 18:00–23:59 Oslo. In New York the end is still the same day, but in UTC+something
    // zones it would not be; what matters is that both ends are compared in Oslo.
    expect(timeRange(new Date('2027-01-29T17:00:00Z'), new Date('2027-01-29T22:30:00Z'))).toBe(
      'Fre 18:00–23:30',
    );
  });

  it('timeRange widens when the event crosses Oslo midnight', () => {
    expect(timeRange(new Date('2027-01-29T17:00:00Z'), new Date('2027-01-29T23:30:00Z'))).toBe(
      'Fre 29. jan. 18:00 – Lør 30. jan. 00:30',
    );
  });

  it('dayLabel names the Oslo day of month', () => {
    const start = new Date('2027-01-29T09:00:00Z');
    expect(dayLabel(start, new Date('2027-01-29T21:00:00Z'))).toBe('29.');
    expect(dayLabel(start, new Date('2027-01-31T21:00:00Z'))).toBe('29.–31.');
  });

  it('osloDaysBetween counts Oslo calendar days', () => {
    const now = new Date('2027-01-28T22:00:00Z'); // 23:00 Thursday in Oslo
    expect(osloDaysBetween(now, new Date('2027-01-28T22:30:00Z'))).toBe(0);
    expect(osloDaysBetween(now, new Date('2027-01-28T23:30:00Z'))).toBe(1); // 00:30 Friday
  });

  it('monthKey groups by Oslo month', () => {
    // 23:30 UTC on 31 January is 1 February in Oslo.
    expect(monthKey(new Date('2027-01-31T23:30:00Z'))).toBe('2027-02');
  });
});

describe('parseInstant', () => {
  it('parses an ISO timestamp', () => {
    expect(parseInstant('2027-01-29T17:00:00Z')?.toISOString()).toBe('2027-01-29T17:00:00.000Z');
  });

  it('returns null for missing or unparseable input', () => {
    expect(parseInstant(undefined)).toBeNull();
    expect(parseInstant('')).toBeNull();
    expect(parseInstant('snart')).toBeNull();
  });
});
