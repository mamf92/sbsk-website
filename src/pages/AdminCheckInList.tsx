import { Link, useLoaderData } from 'react-router-dom';
import EmptyState from '../components/ui/EmptyState';
import { formatAdminEventDate } from '../components/sections/AdminPortalSection/eventDate';
import type { adminCheckInListLoader } from '../loaders/admin-portal-loaders';

/** `/styreportal/innsjekk`: pick the event at the door. Today's comes first. */
export default function AdminCheckInList() {
  const { events } = useLoaderData<typeof adminCheckInListLoader>();
  return (
    <section aria-labelledby="checkin-list-heading" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2
          id="checkin-list-heading"
          className="font-heading text-h2 text-darkblue font-bold dark:text-white"
        >
          Innsjekk
        </h2>
        <p className="font-body text-darkestblue dark:text-white">
          Velg arrangementet du sjekker inn til. Viser arrangementer fra i dag og en uke frem.
        </p>
      </div>
      {events.length === 0 ? (
        <EmptyState
          variant="inline"
          headingLevel={3}
          title="Ingen arrangementer"
          body="Det er ingen arrangementer i kalenderen den nærmeste uken."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {events.map((event) => (
            <li key={event._id}>
              <Link
                to={`/styreportal/innsjekk/${encodeURIComponent(event._id)}`}
                className="bg-darkblue surface-dark lift focus-visible:outline-focus-ring flex min-h-11 flex-col gap-1 p-4 text-white focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <span className="font-heading font-bold">{event.title}</span>
                <span className="font-body text-sm text-gray-100">
                  {formatAdminEventDate(event)}
                  {event.location && ` · ${event.location}`}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
