import { calendarHeroLoader } from '../sanity/queryHelpers/calendar-hero';
import { eventsListLoader } from '../sanity/queryHelpers/events';

export async function calendarLoader() {
  const { calendarHero } = await calendarHeroLoader();
  const { events } = await eventsListLoader();
  return { calendarHero, events };
}
