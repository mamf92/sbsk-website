import { describe, expect, it } from 'vitest';
import { calendarEventIcs } from './eventIcs';

const base = {
  _id: 'abc',
  title: 'Spillkveld',
  eventStartTime: new Date('2026-12-10T16:00:00Z'),
  eventEndTime: new Date('2026-12-10T22:30:00Z'),
  location: 'Byhaugkafeen',
};

describe('calendarEventIcs', () => {
  it('keys the entry by the event id and links to the calendar when there is no page', () => {
    expect(calendarEventIcs(base, 'https://example.org/sbsk/')).toMatchObject({
      title: 'Spillkveld',
      uid: 'abc',
      location: 'Byhaugkafeen',
      url: 'https://example.org/sbsk/kalender',
      allDayDate: undefined,
    });
  });

  it('links to the event page and matches festivalDayIcs for a festival day', () => {
    expect(
      calendarEventIcs(
        { ...base, _id: 'bgm:fre', festivalDay: true, detailPath: '/x?dag=1' },
        'https://e.no/',
      ),
    ).toMatchObject({ uid: 'bgm-fre', url: 'https://e.no/x?dag=1' });
    expect(
      calendarEventIcs({ ...base, hasDetailPage: true, eventSlug: 'jul' }, 'https://e.no/').url,
    ).toBe('https://e.no/arrangementer/jul');
  });

  it('writes an all-day entry as its Oslo date', () => {
    expect(calendarEventIcs({ ...base, allDay: true }).allDayDate).toBe('2026-12-10');
  });
});
