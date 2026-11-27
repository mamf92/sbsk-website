import { homeHeroLoader } from '../sanity/queryHelpers/home-hero';
import { postsLoader } from '../sanity/queryHelpers/posts';
import { upcomingEventsLoader } from '../sanity/queryHelpers/events';
import { calendarFestivalsLoader } from '../sanity/queryHelpers/festivals';
import { festivalDayRows } from '../utils/festival';
import { settle } from './settle';

/**
 * The new front page (behind `redesignEnabled`). Same split as `homeLoader`: the hero photo,
 * the posts and the events are independent, so one failing does not take the others down.
 * Festival days join the events as rows, so a festival can be the next highlight.
 */
export async function homeRedesignLoader() {
  const [hero, posts, events, festivals] = await Promise.all([
    settle(homeHeroLoader().then((result) => result.homeHero)),
    settle(postsLoader().then((result) => result.posts)),
    settle(upcomingEventsLoader()),
    settle(calendarFestivalsLoader()),
  ]);

  return {
    homeHero: hero.data ?? null,
    posts: posts.data ?? [],
    postsFailed: posts.failed,
    // Like `calendarLoader`: festival days alone would pass for the whole programme and put a
    // festival in the game night's place on the hero.
    events: events.failed
      ? []
      : [...(events.data ?? []), ...(festivals.data ?? []).flatMap(festivalDayRows)],
    eventsFailed: events.failed,
  };
}

export type HomeRedesignData = Awaited<ReturnType<typeof homeRedesignLoader>>;
