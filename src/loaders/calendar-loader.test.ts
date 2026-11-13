import { beforeEach, describe, expect, it, vi } from 'vitest';

const calendarHeroLoader = vi.fn();
const calendarEventsLoader = vi.fn();
const calendarFestivalsLoader = vi.fn();

vi.mock('../sanity/queryHelpers/calendar-hero', () => ({
  calendarHeroLoader: () => calendarHeroLoader(),
}));
vi.mock('../sanity/queryHelpers/events', () => ({
  calendarEventsLoader: () => calendarEventsLoader(),
}));
vi.mock('../sanity/queryHelpers/festivals', () => ({
  calendarFestivalsLoader: () => calendarFestivalsLoader(),
}));

const { calendarLoader } = await import('./calendar-loader');

const event = { _id: 'event-1', title: 'Spillkveld' };
const festival = {
  _id: 'bgm',
  slug: 'bgm',
  title: { nb: 'Board Game Masters' },
  days: [{ _key: 'fre', date: '2027-01-29', opens: '17:00', closes: '23:00' }],
};

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  calendarHeroLoader.mockResolvedValue({ calendarHero: null });
  calendarEventsLoader.mockResolvedValue({ events: [event] });
  calendarFestivalsLoader.mockResolvedValue([festival]);
});

describe('calendarLoader', () => {
  it('adds a row per festival day after the events', async () => {
    const { events, eventsFailed } = await calendarLoader();
    expect(eventsFailed).toBe(false);
    expect(events.map((row) => row._id)).toEqual(['event-1', 'bgm:fre']);
  });

  it('still shows the events when the festivals fail', async () => {
    calendarFestivalsLoader.mockRejectedValue(new Error('down'));
    const { events, eventsFailed } = await calendarLoader();
    expect(eventsFailed).toBe(false);
    expect(events.map((row) => row._id)).toEqual(['event-1']);
  });

  it('leaves the list empty when the events fail, so the calendar says so', async () => {
    calendarEventsLoader.mockRejectedValue(new Error('down'));
    const { events, eventsFailed } = await calendarLoader();
    expect(eventsFailed).toBe(true);
    expect(events).toEqual([]);
  });
});
