import { describe, expect, it } from 'vitest';
import type { CalendarEventTypes } from '../sanity/queryHelpers/events';
import { buildCalendarFeed, calendarFeedUrls } from './calendarFeed';
import { calendarEventIcs } from './eventIcs';
import { buildIcsCalendar } from './ics';

const NOW = new Date('2026-11-26T12:00:00Z');

function event(_id: string, start: string, end: string): CalendarEventTypes {
  return {
    _id,
    title: _id,
    category: 'spillkveld',
    eventStartTime: new Date(start),
    eventEndTime: new Date(end),
  };
}

const SITE = 'https://mamf92.github.io/sbsk-website/';

describe('buildCalendarFeed', () => {
  const feed = buildCalendarFeed(
    [
      event('next', '2026-12-10T16:00:00Z', '2026-12-10T22:30:00Z'),
      event('old', '2026-01-08T16:00:00Z', '2026-01-08T22:30:00Z'),
      event('recent', '2026-11-12T16:00:00Z', '2026-11-12T22:30:00Z'),
    ],
    SITE,
    NOW,
  );

  it('is a named subscription that asks to be refreshed twice a day', () => {
    expect(feed).toContain('X-WR-CALNAME:Stavanger Brettspillklubb');
    expect(feed).toContain('REFRESH-INTERVAL;VALUE=DURATION:PT12H');
    expect(feed.split('\r\n')[0]).toBe('BEGIN:VCALENDAR');
  });

  it('keeps the last 90 days and everything to come, in date order', () => {
    const uids = [...feed.matchAll(/^UID:(.+)$/gm)].map((m) => m[1].trim());
    expect(uids).toEqual(['recent@sbsk.no', 'next@sbsk.no']);
  });

  it('uses the same UID as the one-off «Legg i kalenderen» download', () => {
    const single = buildIcsCalendar([
      calendarEventIcs(event('next', '2026-12-10T16:00:00Z', '2026-12-10T22:30:00Z'), SITE),
    ]);
    expect(single).toContain('UID:next@sbsk.no');
    expect(feed).toContain('URL:https://mamf92.github.io/sbsk-website/kalender');
  });
});

describe('calendarFeedUrls', () => {
  it('gives the https, webcal and Google Calendar addresses', () => {
    expect(calendarFeedUrls(SITE)).toEqual({
      https: 'https://mamf92.github.io/sbsk-website/kalender.ics',
      webcal: 'webcal://mamf92.github.io/sbsk-website/kalender.ics',
      google:
        'https://calendar.google.com/calendar/r?cid=webcal%3A%2F%2Fmamf92.github.io%2Fsbsk-website%2Fkalender.ics',
    });
  });
});

describe('foldIcsLine', () => {
  it('folds long lines at 75 octets without splitting a character', async () => {
    const { foldIcsLine } = await import('./ics');
    const line = `SUMMARY:${'Spillkveld på Byhaugkafeen, '.repeat(4)}`;
    const folded = foldIcsLine(line);
    const parts = folded.split('\r\n');
    expect(parts.length).toBeGreaterThan(1);
    for (const part of parts) expect(new TextEncoder().encode(part).length).toBeLessThanOrEqual(75);
    expect(parts.map((p, i) => (i ? p.slice(1) : p)).join('')).toBe(line);
    expect(foldIcsLine('SUMMARY:kort')).toBe('SUMMARY:kort');
  });
});
