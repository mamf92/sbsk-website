import { Link, useLoaderData } from 'react-router-dom';
import type { SanityDocument } from '@sanity/client';

export default function Events() {
  const { events } = useLoaderData() as { events: SanityDocument[] };
  return (
    <div className="dark:bg-darkestblue min-h-[60vh] bg-white dark:text-white">
      {/* An <h1>, not a <div>: this route has content, so it is not one of #147's placeholders,
          but it had the same missing document heading. The orange-on-white still belongs to
          #136. */}
      <h1 className="text-orange font-heading text-h1 font-bold">Arrangementer</h1>
      <ul className="flex flex-col gap-y-4">
        {events.map((event) => (
          <li className="hover:underline" key={event._id}>
            <Link to={`/arrangementer/${event.slug.current}`}>
              <h2 className="text-h2 font-semibold">{event.title}</h2>
              <p>{new Date(event.publishedAt).toLocaleDateString()}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
