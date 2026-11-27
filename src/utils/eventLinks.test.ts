import { describe, expect, it } from 'vitest';
import { eventDetailPath, eventLink } from './eventLinks';

describe('eventDetailPath', () => {
  it('links an event with its own page by slug', () => {
    expect(eventDetailPath({ hasDetailPage: true, eventSlug: 'hostturnering' })).toBe(
      '/arrangementer/hostturnering',
    );
  });

  it('never links an event the editor kept calendar-only', () => {
    expect(eventDetailPath({ hasDetailPage: false, eventSlug: 'spillkveld' })).toBeNull();
    expect(eventDetailPath({ hasDetailPage: true })).toBeNull();
  });

  it('prefers a row’s own path, such as a festival day', () => {
    expect(eventDetailPath({ detailPath: '/arrangementer/bgm?dag=2', eventSlug: 'x' })).toBe(
      '/arrangementer/bgm?dag=2',
    );
  });
});

describe('eventLink', () => {
  it('goes to the event’s own page when it has one', () => {
    expect(eventLink({ _id: 'a', hasDetailPage: true, eventSlug: 'jul' })).toBe(
      '/arrangementer/jul',
    );
  });

  it('otherwise opens the event on «Alle arrangementer»', () => {
    expect(eventLink({ _id: 'spill kveld', hasDetailPage: false })).toBe(
      '/kalender/alle?arrangement=spill%20kveld',
    );
  });
});
