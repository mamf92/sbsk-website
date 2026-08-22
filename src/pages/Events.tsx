import { Link, useLoaderData } from 'react-router-dom';
import type { SanityDocument } from '@sanity/client';

export default function Events() {
  const { events } = useLoaderData() as { events: SanityDocument[] };
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
        {events.map((event) => (
          <li className="hover:underline" key={event._id}>
            {/* `eventSlug`, not `slug.current`: EVENTS_LIST_QUERY projects the slug flat, so
                `event.slug` is undefined here and reading `.current` off it threw for every
                row. Likewise `publishedAt` is not in that projection — and an events list
                wants the date the event happens on, not the date it was written. */}
            <Link to={`/arrangementer/${event.eventSlug}`}>
              <h2 className="text-h2 font-semibold">{event.title}</h2>
              <p>{new Date(event.eventStartTime).toLocaleDateString('nb-NO')}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
