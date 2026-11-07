import type { CalendarHeroTypes } from '../sanity/queryHelpers/calendar-hero';
import type { CalendarEventTypes } from '../sanity/queryHelpers/events';
import CalendarSection from '../components/sections/CalendarSection';
import { useLoaderData } from 'react-router-dom';

export default function Calendar() {
  const { calendarHero, events, eventsFailed } = useLoaderData() as {
    calendarHero: CalendarHeroTypes | null;
    events: CalendarEventTypes[];
    eventsFailed: boolean;
  };
  return (
    <>
      <div className="bg-page text-fg min-h-[60vh]">
        {calendarHero ? (
          <CalendarSection calendarHero={calendarHero} events={events} failed={eventsFailed} />
        ) : (
          <CalendarSection events={events} failed={eventsFailed} />
        )}
      </div>
    </>
  );
}
