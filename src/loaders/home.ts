import { homeHeroLoader } from '../sanity/queryHelpers/home-hero';
import { postsLoader } from '../sanity/queryHelpers/posts';
import { calendarHeroLoader } from '../sanity/queryHelpers/calendar-hero';
import { eventsListLoader } from '../sanity/queryHelpers/events';
import { getAdmins } from '../supabase/queryHelpers/getAdmins';

export async function homeLoader() {
  const { homeHero } = await homeHeroLoader();
  const { posts } = await postsLoader();
  const { calendarHero } = await calendarHeroLoader();
  const { events } = await eventsListLoader();
  const { data: admins } = await getAdmins();
  return { homeHero, posts, calendarHero, events, admins };
}
