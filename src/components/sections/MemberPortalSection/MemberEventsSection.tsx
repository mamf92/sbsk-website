import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Panel } from '../../ui/Panel';
import { Button } from '../../ui/Buttons';
import { Alert } from '../../ui/Alert';
import { linkClassesInherit } from '../../ui/Link';
import { joinEvent, leaveEvent } from '../../../supabase/queryHelpers/eventParticipants';
import { formatAdminEventDate } from '../AdminPortalSection/eventDate';
import type { AdminEvent } from '../../../sanity/queryHelpers/admin-events';
import { scoreSuggestions } from '../../../utils/suggestions';

interface MemberEventsSectionProps {
  supabaseId: string;
  events: AdminEvent[];
  joined: string[];
  counts: Record<string, number>;
  favourite: string | null;
  failed: boolean;
  /** For tests; the real clock otherwise. */
  now?: Date;
}

function eventPath(event: AdminEvent): string {
  return event.hasDetailPage && event.slug ? `/arrangementer/${event.slug}` : '/kalender';
}

/**
 * "Mine påmeldinger" and "Forslag til deg" side by side: what the member is going to, and up to
 * three events worth joining (`scoreSuggestions`). Join and leave work in place, optimistically,
 * and roll back with a message if the write fails.
 */
export default function MemberEventsSection({
  supabaseId,
  events,
  joined: initiallyJoined,
  counts: initialCounts,
  favourite,
  failed,
  now = new Date(),
}: MemberEventsSectionProps) {
  const [joined, setJoined] = useState(() => new Set(initiallyJoined));
  const [counts, setCounts] = useState(initialCounts);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mine = events.filter((event) => joined.has(event._id));
  // Scored once against the joined set as loaded, so a suggestion does not jump away the moment
  // the member taps it; it moves to "Mine påmeldinger" and its slot stays until the next visit.
  const suggestions = useMemo(
    () => scoreSuggestions(events, new Set(initiallyJoined), initialCounts, favourite, now),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [events, initiallyJoined, initialCounts, favourite],
  );
  const openSuggestions = suggestions.filter((event) => !joined.has(event._id));

  async function toggle(event: AdminEvent) {
    if (pending) return;
    const leaving = joined.has(event._id);
    const apply = (join: boolean) => {
      setJoined((current) => {
        const next = new Set(current);
        if (join) next.add(event._id);
        else next.delete(event._id);
        return next;
      });
      setCounts((current) => ({
        ...current,
        [event._id]: Math.max(0, (current[event._id] ?? 0) + (join ? 1 : -1)),
      }));
    };
    setError(null);
    setPending(event._id);
    apply(!leaving);
    try {
      if (leaving) await leaveEvent(event._id, supabaseId);
      else await joinEvent(event._id, supabaseId);
    } catch {
      apply(leaving);
      setError(
        leaving
          ? `Vi fikk ikke meldt deg av «${event.title}». Prøv igjen.`
          : `Vi fikk ikke meldt deg på «${event.title}». Prøv igjen.`,
      );
    } finally {
      setPending(null);
    }
  }

  const row = (event: AdminEvent, action: 'join' | 'leave') => {
    const coming = counts[event._id] ?? 0;
    return (
      <li
        key={event._id}
        className="flex flex-wrap items-center justify-between gap-3 border-t border-white/12 pt-3 first:border-t-0 first:pt-0"
      >
        <div className="flex min-w-0 flex-col">
          <span className="text-sm">{formatAdminEventDate(event)}</span>
          <Link to={eventPath(event)} className={`${linkClassesInherit} font-heading font-bold`}>
            {event.title}
          </Link>
          <span className="text-sm">{coming === 1 ? '1 påmeldt' : `${coming} påmeldt`}</span>
        </div>
        <Button
          type="button"
          size="sm"
          variant={action === 'join' ? 'primary' : 'outline'}
          loading={pending === event._id}
          aria-label={
            action === 'join' ? `Meld meg på ${event.title}` : `Meld meg av ${event.title}`
          }
          onClick={() => void toggle(event)}
        >
          {action === 'join' ? 'Meld meg på' : 'Meld av'}
        </Button>
      </li>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {failed && (
        <Alert tone="warning">
          Vi fikk ikke hentet alle arrangementene akkurat nå. Last siden på nytt om litt.
        </Alert>
      )}
      {error && <Alert>{error}</Alert>}
      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Mine påmeldinger">
          {mine.length > 0 ? (
            <ul className="flex flex-col gap-3">{mine.map((event) => row(event, 'leave'))}</ul>
          ) : (
            <p>Du er ikke påmeldt noe ennå. Se forslagene, eller finn noe i kalenderen.</p>
          )}
          <Link to="/kalender" className={`${linkClassesInherit} underline`}>
            Se hele kalenderen
          </Link>
        </Panel>
        <Panel title="Forslag til deg">
          {openSuggestions.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {openSuggestions.map((event) => row(event, 'join'))}
            </ul>
          ) : (
            <p>Du er påmeldt alt som skjer fremover. Vi sees!</p>
          )}
        </Panel>
      </div>
    </div>
  );
}
