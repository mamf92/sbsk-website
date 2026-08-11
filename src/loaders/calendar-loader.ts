import { calendarHeroLoader } from '../sanity/queryHelpers/calendar-hero';
import { calendarEventsLoader } from '../sanity/queryHelpers/events';

export async function calendarLoader() {
  const { calendarHero } = await calendarHeroLoader();
  const { events } = await calendarEventsLoader();
  return { calendarHero, events };
}
