import { homeHeroLoader } from '../sanity/queryHelpers/home-hero';
import { postsLoader } from '../sanity/queryHelpers/posts';
import { calendarHeroLoader } from '../sanity/queryHelpers/calendar-hero';
import { eventsListLoader } from '../sanity/queryHelpers/events';

export async function homeLoader() {
  const { homeHero } = await homeHeroLoader();
  const { posts } = await postsLoader();
  const { calendarHero } = await calendarHeroLoader();
  const { events } = await eventsListLoader();
  return { homeHero, posts, calendarHero, events };
}
