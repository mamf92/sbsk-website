import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert } from '../../ui/Alert';
import { AvatarStack } from '../../ui/AvatarStack';
import { Button } from '../../ui/Buttons';
import { buttonClasses } from '../../ui/buttonClasses';
import EmptyState from '../../ui/EmptyState';
import { Panel } from '../../ui/Panel';
import type { AdminEvent } from '../../../sanity/queryHelpers/admin-events';
import type { AdminSignup } from '../../../supabase/queryHelpers/getEventSignupsForAdmin';
import { formatAdminEventDate } from './eventDate';

type UpcomingEventsPanelProps = {
  events: AdminEvent[];
  signups: Record<string, AdminSignup[]>;
  /** The sign-up read failed: say so rather than show "0 påmeldt" for every event. */
  signupsUnavailable?: boolean;
};

/**
 * The next events and who is coming (phase 2 plan, "Admin overview"). The first event is shown
 * open, as Martin asked for "the next event and who is signed up"; the rest collapse to one
 * line each with the count and faces, and expand to the name list.
 */
export default function UpcomingEventsPanel({
  events,
  signups,
  signupsUnavailable = false,
}: UpcomingEventsPanelProps) {
  return (
    <Panel title="Kommende arrangementer" className="min-w-0">
      {signupsUnavailable && (
        <Alert>Påmeldinger kunne ikke hentes akkurat nå. Prøv å laste siden på nytt.</Alert>
      )}
      {events.length === 0 ? (
        <EmptyState
          variant="inline"
          headingLevel={3}
          title="Ingen arrangementer"
          body="Det ligger ingen kommende arrangementer i kalenderen."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {events.map((event, index) => (
            <EventRow
              key={event._id}
              event={event}
              signups={signups[event._id] ?? []}
              defaultOpen={index === 0}
              signupsUnavailable={signupsUnavailable}
            />
          ))}
        </ul>
      )}
    </Panel>
  );
}

function EventRow({
  event,
  signups,
  defaultOpen,
  signupsUnavailable,
}: {
  event: AdminEvent;
  signups: AdminSignup[];
  defaultOpen: boolean;
  signupsUnavailable: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const listId = useId();
  const people = signups.map((s) => ({ name: s.displayName }));

  return (
    <li className="bg-darkestblue flex flex-col gap-3 border border-white/20 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="font-body text-sm text-gray-100">{formatAdminEventDate(event)}</p>
          <h3 className="font-heading text-h4 font-bold">{event.title}</h3>
          {event.location && <p className="font-body text-sm text-gray-100">{event.location}</p>}
        </div>
        <div className="flex items-center gap-3">
          {people.length > 0 && <AvatarStack people={people} max={4} size="sm" overlap />}
          {!signupsUnavailable && (
            <p className="font-heading text-h3 font-bold" aria-label={`${signups.length} påmeldt`}>
              {signups.length}
              <span className="font-body ml-1 text-xs font-normal text-gray-100" aria-hidden="true">
                påmeldt
              </span>
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {signups.length > 0 && (
          <Button
            variant="outline"
            size="xs"
            icon="down"
            aria-expanded={open}
            aria-controls={listId}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? 'Skjul påmeldte' : 'Vis påmeldte'}
          </Button>
        )}
        <Link
          to={`/styreportal/innsjekk/${encodeURIComponent(event._id)}`}
          className={buttonClasses({ variant: 'primary', size: 'xs' })}
        >
          Gå til innsjekk
        </Link>
      </div>
      {open && signups.length > 0 && (
        <ul id={listId} className="font-body grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
          {signups.map((s) => (
            <li
              key={s.supabaseId}
              className="flex min-w-0 justify-between gap-2 border-b border-white/10 py-1"
            >
              <span className="truncate">{s.displayName}</span>
              {s.email && <span className="truncate text-gray-100">{s.email}</span>}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
