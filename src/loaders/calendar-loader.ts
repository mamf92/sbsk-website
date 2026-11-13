import { calendarHeroLoader } from '../sanity/queryHelpers/calendar-hero';
import { calendarEventsLoader } from '../sanity/queryHelpers/events';
import { calendarFestivalsLoader } from '../sanity/queryHelpers/festivals';
import { festivalDayRows } from '../utils/festival';
import { settle } from './settle';

/** Same split as `homeLoader`: a failed hero must not cost the visitor the calendar. */
export async function calendarLoader() {
  const [hero, events, festivals] = await Promise.all([
    settle(calendarHeroLoader().then((result) => result.calendarHero)),
    settle(calendarEventsLoader().then((result) => result.events)),
    // Festival days are extra rows: if they fail, the events still show.
    settle(calendarFestivalsLoader()),
  ]);

  return {
    calendarHero: hero.data ?? null,
    events: [...(events.data ?? []), ...(festivals.data ?? []).flatMap(festivalDayRows)],
    eventsFailed: events.failed,
  };
}
