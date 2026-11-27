import { describe, expect, it } from 'vitest';
import type { CalendarEventTypes } from '../sanity/queryHelpers/events';
import {
  countdownLabel,
  eventHighlights,
  isSpecialEvent,
  nextGameNight,
  takesClubSignUp,
  upcomingEvents,
} from './eventHighlights';

const NOW = new Date('2026-11-26T12:00:00Z');

function event(partial: Partial<CalendarEventTypes> & { _id: string }): CalendarEventTypes {
  return {
    title: partial._id,
    category: 'spillkveld',
    eventStartTime: new Date('2026-12-10T16:00:00Z'),
    eventEndTime: new Date('2026-12-10T22:30:00Z'),
    ...partial,
  };
}

const night = event({ _id: 'night' });
const tonight = event({
  _id: 'tonight',
  eventStartTime: new Date('2026-11-26T16:00:00Z'),
  eventEndTime: new Date('2026-11-26T22:30:00Z'),
});
const past = event({
  _id: 'past',
  eventStartTime: new Date('2026-11-12T16:00:00Z'),
  eventEndTime: new Date('2026-11-12T22:30:00Z'),
});
const jul = event({
  _id: 'jul',
  hasDetailPage: true,
  eventSlug: 'julespillkveld',
  eventStartTime: new Date('2026-12-17T16:00:00Z'),
  eventEndTime: new Date('2026-12-17T21:00:00Z'),
});
const cup = event({
  _id: 'cup',
  category: 'turnering',
  eventStartTime: new Date('2027-03-13T09:00:00Z'),
  eventEndTime: new Date('2027-03-13T16:00:00Z'),
});
const festival = { slug: 'bgm-2027', name: 'Board Game Masters' };
const bgmFri = event({
  _id: 'bgm:fre',
  category: 'turnering',
  festivalDay: true,
  festival,
  detailPath: '/arrangementer/bgm-2027?dag=1',
  eventStartTime: new Date('2027-01-29T16:00:00Z'),
  eventEndTime: new Date('2027-01-29T22:00:00Z'),
});
const bgmSun = event({
  ...bgmFri,
  _id: 'bgm:son',
  detailPath: '/arrangementer/bgm-2027?dag=3',
  eventStartTime: new Date('2027-01-31T09:00:00Z'),
  eventEndTime: new Date('2027-01-31T17:00:00Z'),
});

describe('upcomingEvents', () => {
  it('drops finished events and sorts by start', () => {
    expect(upcomingEvents([cup, night, past, tonight], NOW).map((e) => e._id)).toEqual([
      'tonight',
      'night',
      'cup',
    ]);
  });
});

describe('isSpecialEvent', () => {
  it('treats an ordinary game night as routine', () => {
    expect(isSpecialEvent(night)).toBe(false);
  });

  it('treats tournaments, festival days and game nights with their own page as special', () => {
    expect(isSpecialEvent(cup)).toBe(true);
    expect(isSpecialEvent(bgmFri)).toBe(true);
    expect(isSpecialEvent(jul)).toBe(true);
  });

  it('treats a game night with its own image as special', () => {
    expect(isSpecialEvent({ ...night, image: { asset: { _ref: 'image-x' } } })).toBe(true);
  });
});

describe('nextGameNight', () => {
  it('picks the next game night, even with a tournament before it', () => {
    const early = { ...cup, eventStartTime: new Date('2026-11-27T09:00:00Z') };
    expect(nextGameNight([early, night, tonight], NOW)?._id).toBe('tonight');
  });

  it('falls back to the next event of any kind, then to null', () => {
    expect(nextGameNight([cup], NOW)?._id).toBe('cup');
    expect(nextGameNight([past], NOW)).toBeNull();
  });
});

describe('countdownLabel', () => {
  it('says tonight, tomorrow or in N days in Oslo time', () => {
    expect(countdownLabel(new Date('2026-11-26T16:00:00Z'), NOW)).toBe('i kveld');
    expect(countdownLabel(new Date('2026-11-26T13:00:00Z'), NOW)).toBe('i dag');
    expect(countdownLabel(new Date('2026-11-27T16:00:00Z'), NOW)).toBe('i morgen');
    expect(countdownLabel(new Date('2026-12-02T16:00:00Z'), NOW)).toBe('om 6 dager');
  });
});

describe('eventHighlights', () => {
  it('folds festival days into one poster and keeps only special events', () => {
    const highlights = eventHighlights([night, cup, bgmSun, bgmFri, jul, past], NOW);
    expect(highlights.map((h) => h.key)).toEqual(['jul', 'festival:bgm-2027', 'cup']);
    const bgm = highlights[1];
    expect(bgm).toMatchObject({
      kind: 'festival',
      title: 'Board Game Masters',
      href: '/arrangementer/bgm-2027',
    });
    expect(bgm.start.toISOString()).toBe('2027-01-29T16:00:00.000Z');
    expect(bgm.end.toISOString()).toBe('2027-01-31T17:00:00.000Z');
    expect(highlights[0].href).toBe('/arrangementer/julespillkveld');
    expect(highlights[2].href).toBeNull();
  });
});

describe('takesClubSignUp', () => {
  it('gives «Bli med» only where there is no other way to sign up', () => {
    expect(takesClubSignUp(night, NOW)).toBe(true);
    expect(takesClubSignUp(event({ _id: 'd', signup: { method: 'oppmote' } }), NOW)).toBe(true);
    expect(
      takesClubSignUp(
        event({ _id: 's', signup: { method: 'spond', url: 'https://spond.com/x' } }),
        NOW,
      ),
    ).toBe(false);
    expect(takesClubSignUp(event({ _id: 'c', signup: { method: 'stengt' } }), NOW)).toBe(false);
    expect(takesClubSignUp(event({ _id: 'f', festivalDay: true }), NOW)).toBe(false);
  });
});

describe('eventHighlights labels', () => {
  it('tags a Board Game Masters festival «Turnering»', () => {
    const day = event({
      _id: 'bgm-day',
      category: 'turnering',
      festivalDay: true,
      festival: { slug: 'bgm', name: 'Board Game Masters', series: 'bgm' },
    });
    expect(eventHighlights([day], NOW)[0].label).toBe('Turnering');
    const other = {
      ...day,
      festival: { slug: 'x', name: 'Sommerspillhelg', series: 'annet' as const },
    };
    expect(eventHighlights([other], NOW)[0].label).toBeUndefined();
  });
});
