import { beforeEach, describe, expect, it, vi } from 'vitest';

const homeHeroLoader = vi.fn();
const postsLoader = vi.fn();
const upcomingEventsLoader = vi.fn();
const calendarFestivalsLoader = vi.fn();

vi.mock('../sanity/queryHelpers/home-hero', () => ({ homeHeroLoader: () => homeHeroLoader() }));
vi.mock('../sanity/queryHelpers/posts', () => ({ postsLoader: () => postsLoader() }));
vi.mock('../sanity/queryHelpers/events', () => ({
  upcomingEventsLoader: () => upcomingEventsLoader(),
}));
vi.mock('../sanity/queryHelpers/festivals', () => ({
  calendarFestivalsLoader: () => calendarFestivalsLoader(),
}));

const { homeRedesignLoader } = await import('./home-redesign-loader');

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  homeHeroLoader.mockResolvedValue({ homeHero: { title: 'SBSK' } });
  postsLoader.mockResolvedValue({ posts: [{ _id: 'p' }] });
  upcomingEventsLoader.mockResolvedValue([{ _id: 'e' }]);
  calendarFestivalsLoader.mockResolvedValue([
    {
      _id: 'bgm',
      slug: 'bgm',
      title: { nb: 'Board Game Masters' },
      days: [{ _key: 'fre', date: '2027-01-29', opens: '17:00', closes: '23:00' }],
    },
  ]);
});

describe('homeRedesignLoader', () => {
  it('returns the hero, posts, and events with festival days as rows', async () => {
    const data = await homeRedesignLoader();
    expect(data.homeHero).toEqual({ title: 'SBSK' });
    expect(data.posts).toHaveLength(1);
    expect(data.events.map((e) => e._id)).toEqual(['e', 'bgm:fre']);
    expect(data.eventsFailed).toBe(false);
  });

  it('keeps the posts when the events fail', async () => {
    upcomingEventsLoader.mockRejectedValue(new Error('down'));
    const data = await homeRedesignLoader();
    expect(data.posts).toHaveLength(1);
    expect(data.eventsFailed).toBe(true);
  });
});
