import { Link, useLoaderData } from 'react-router-dom';
import type { SanityDocument } from '@sanity/client';

export default function Events() {
  const { events } = useLoaderData() as { events: SanityDocument[] };
  return (
    <>
      <main className="dark:bg-darkestblue min-h-[60vh] bg-white dark:text-white">
        <div className="text-orange font-heading text-6xl font-bold">Arrangementer</div>
        <ul className="flex flex-col gap-y-4">
          {events.map((event) => (
            <li className="hover:underline" key={event._id}>
              <Link to={`/arrangementer/${event.slug.current}`}>
                <h2 className="text-xl font-semibold">{event.title}</h2>
                <p>{new Date(event.publishedAt).toLocaleDateString()}</p>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
