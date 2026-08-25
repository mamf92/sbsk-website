import { Link, useLoaderData } from 'react-router-dom';
import type { CalendarEventTypes } from '../sanity/queryHelpers/events';

export default function Events() {
  const { events } = useLoaderData() as { events: CalendarEventTypes[] };
  return (
    <div className="dark:bg-darkestblue min-h-[60vh] bg-white dark:text-white">
      {/* An <h1>, not a <div>: this route has content, so it is not one of #147's placeholders,
          but it had the same missing document heading. #136 fixed the orange-on-white: orange
          only clears AA on the darkestblue fill dark mode uses here, so light mode takes
          darkestblue instead, matching the pairing HomeHeroSection's <h1> already uses. */}
      <h1 className="text-darkestblue dark:text-orange font-heading text-h1 font-bold">
        Arrangementer
      </h1>
      <ul className="flex flex-col gap-y-4">
        {events.map((event) => {
          // Only events flagged with `hasDetailPage` in Sanity have a page to link to — that
          // is a content decision, independent of category or event size, so it is never
          // inferred from `eventSlug` alone.
          const detailPath =
            event.hasDetailPage && event.eventSlug ? `/arrangementer/${event.eventSlug}` : null;
          const body = (
            <>
              <h2 className="text-h2 font-semibold">{event.title}</h2>
              <p>{new Date(event.eventStartTime).toLocaleDateString('nb-NO')}</p>
            </>
          );

          return (
            <li className={detailPath ? 'hover:underline' : ''} key={event._id}>
              {detailPath ? <Link to={detailPath}>{body}</Link> : body}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
