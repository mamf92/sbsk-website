import { describe, expect, it, vi, beforeEach } from 'vitest';

const homeHeroLoader = vi.fn();
const postsLoader = vi.fn();

vi.mock('../sanity/queryHelpers/home-hero', () => ({
  homeHeroLoader: () => homeHeroLoader(),
}));
vi.mock('../sanity/queryHelpers/posts', () => ({
  postsLoader: () => postsLoader(),
}));

const { homeLoader } = await import('./home-loader');

const hero = { title: 'Stavanger Brettspillklubb' };
const posts = [{ _id: 'post-1', title: 'Et innlegg' }];

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  homeHeroLoader.mockReset();
  postsLoader.mockReset();
});

describe('homeLoader', () => {
  it('returns both sources when both resolve', async () => {
    homeHeroLoader.mockResolvedValue({ homeHero: hero });
    postsLoader.mockResolvedValue({ posts });

    await expect(homeLoader()).resolves.toEqual({ homeHero: hero, posts, postsFailed: false });
  });

  // The point of #63: the front page has two independent pieces of content, and losing one is not
  // a reason to lose the other. Before this, an awaited hero that rejected took the page down.
  it('still returns the posts when the hero fails', async () => {
    homeHeroLoader.mockRejectedValue(new Error('sanity down'));
    postsLoader.mockResolvedValue({ posts });

    await expect(homeLoader()).resolves.toEqual({ homeHero: null, posts, postsFailed: false });
  });

  it('still returns the hero when the posts fail, and says so', async () => {
    homeHeroLoader.mockResolvedValue({ homeHero: hero });
    postsLoader.mockRejectedValue(new Error('sanity down'));

    // `postsFailed` is what lets the section say "could not load" instead of "there are none".
    await expect(homeLoader()).resolves.toEqual({ homeHero: hero, posts: [], postsFailed: true });
  });

  it('renders something rather than throwing when both fail', async () => {
    homeHeroLoader.mockRejectedValue(new Error('sanity down'));
    postsLoader.mockRejectedValue(new Error('sanity down'));

    // Throwing here would hand the whole route to RouteError; the hero has fallback copy of its
    // own, so there is still a usable page to show.
    await expect(homeLoader()).resolves.toEqual({ homeHero: null, posts: [], postsFailed: true });
  });
});
