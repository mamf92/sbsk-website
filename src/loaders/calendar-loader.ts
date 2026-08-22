import { calendarHeroLoader } from '../sanity/queryHelpers/calendar-hero';
import { calendarEventsLoader } from '../sanity/queryHelpers/events';
import { settle } from './settle';

/** Same split as `homeLoader`: a failed hero must not cost the visitor the calendar. */
export async function calendarLoader() {
  const [hero, events] = await Promise.all([
    settle(calendarHeroLoader().then((result) => result.calendarHero)),
    settle(calendarEventsLoader().then((result) => result.events)),
  ]);

  return {
    calendarHero: hero.data ?? null,
    events: events.data ?? [],
    eventsFailed: events.failed,
  };
}
