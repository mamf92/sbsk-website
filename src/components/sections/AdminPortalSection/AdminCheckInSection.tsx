import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert } from '../../ui/Alert';
import { Button } from '../../ui/Buttons';
import EmptyState from '../../ui/EmptyState';
import { Input } from '../../ui/Input';
import { StatTile } from '../../ui/StatTile';
import { Tag } from '../../ui/Tag';
import { linkClassesInherit } from '../../ui/Link';
import { formatAdminEventDate, osloDate } from './eventDate';
import type { AdminEvent } from '../../../sanity/queryHelpers/admin-events';
import type { AdminSignup } from '../../../supabase/queryHelpers/getEventSignupsForAdmin';
import type { Member } from '../../../supabase/queryHelpers/getMember';
import {
  checkInMember,
  setGuestCount,
  undoCheckIn,
  type CheckInEvent,
} from '../../../supabase/queryHelpers/checkIn';
import { compareMemberNames, memberMatches } from '../../../utils/membership';

type AdminCheckInSectionProps = {
  event: AdminEvent;
  members: Member[];
  checkedIn: string[];
  guests: number;
  signups: AdminSignup[];
};

const MAX_GUESTS = 10000;

/**
 * Door check-in on a phone (`/styreportal/innsjekk/:eventId`). Search is focused on arrival;
 * members who signed up come first, then every other active member, since most club nights
 * have no sign-up at all. Taps are optimistic, with the change rolled back and explained if the
 * database refuses it. Guests (non-members) are a headcount, not names.
 */
export default function AdminCheckInSection({
  event,
  members,
  checkedIn: initialCheckedIn,
  guests: initialGuests,
  signups,
}: AdminCheckInSectionProps) {
  const target: CheckInEvent = useMemo(
    () => ({ id: event._id, date: osloDate(event), category: event.category }),
    [event],
  );
  const [checkedIn, setCheckedIn] = useState(() => new Set(initialCheckedIn));
  const [guests, setGuests] = useState(initialGuests);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  // Guest taps are written in order, so a slow first write cannot land after a second one.
  const guestWrites = useRef<Promise<void>>(Promise.resolve());

  const signedUp = useMemo(
    () => new Set(signups.map((s) => s.memberId).filter((id): id is string => Boolean(id))),
    [signups],
  );

  const ordered = useMemo(() => {
    const active = members.filter((m) => m.status === 'active' && memberMatches(m, query));
    return [
      ...active.filter((m) => signedUp.has(m.id)).sort(compareMemberNames),
      ...active.filter((m) => !signedUp.has(m.id)).sort(compareMemberNames),
    ];
  }, [members, query, signedUp]);

  const toggle = async (member: Member) => {
    const wasIn = checkedIn.has(member.id);
    const flip = (on: boolean) =>
      setCheckedIn((prev) => {
        const next = new Set(prev);
        if (on) next.add(member.id);
        else next.delete(member.id);
        return next;
      });

    setError(null);
    flip(!wasIn);
    try {
      if (wasIn) await undoCheckIn(target.id, member.id);
      else await checkInMember(target, member.id);
    } catch {
      flip(wasIn);
      setError(
        `Kunne ikke ${wasIn ? 'angre innsjekken for' : 'sjekke inn'} ${member.name}. Sjekk nettet og prøv igjen.`,
      );
    }
  };

  const changeGuests = (delta: number) => {
    const before = guests;
    const after = Math.min(MAX_GUESTS, Math.max(0, before + delta));
    if (after === before) return;
    setError(null);
    setGuests(after);
    guestWrites.current = guestWrites.current.then(() =>
      setGuestCount(target, after).catch(() => {
        setGuests(before);
        setError('Kunne ikke lagre antall gjester. Prøv igjen.');
      }),
    );
  };

  return (
    <section aria-labelledby="checkin-heading" className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link
          to="/styreportal/innsjekk"
          className={`${linkClassesInherit} font-body text-darkblue w-fit text-sm dark:text-white`}
        >
          Alle arrangementer
        </Link>
        <h2
          id="checkin-heading"
          className="font-heading text-h2 text-darkblue font-bold dark:text-white"
        >
          {event.title}
        </h2>
        <p className="font-body text-darkestblue dark:text-white">
          {formatAdminEventDate(event)}
          {event.location && ` · ${event.location}`}
        </p>
      </div>

      <div className="sm:max-w-aside grid grid-cols-2 gap-2">
        <StatTile tone="light" value={checkedIn.size} label="Sjekket inn" aria-live="polite" />
        <div className="flex flex-col gap-2">
          <StatTile tone="light" value={guests} label="Gjester" aria-live="polite" />
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="tertiary"
              size="md"
              aria-label="Én gjest færre"
              disabled={guests === 0}
              onClick={() => changeGuests(-1)}
            >
              −
            </Button>
            <Button
              variant="tertiary"
              size="md"
              aria-label="Én gjest til"
              onClick={() => changeGuests(1)}
            >
              +
            </Button>
          </div>
        </div>
      </div>

      <Input
        type="search"
        icon="search"
        aria-label="Søk etter medlem"
        placeholder="Søk etter navn"
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {error && <Alert>{error}</Alert>}

      {ordered.length === 0 ? (
        <EmptyState
          variant="inline"
          headingLevel={3}
          title="Ingen treff"
          body="Er personen ikke medlem? Tell dem som gjest."
        />
      ) : (
        <ul
          aria-label="Medlemmer"
          className="flex flex-col border-t border-gray-300 dark:border-white/20"
        >
          {ordered.map((member) => {
            const isIn = checkedIn.has(member.id);
            const fullName = `${member.name} ${member.surname}`.trim();
            return (
              <li
                key={member.id}
                className="text-darkestblue flex items-center justify-between gap-3 border-b border-gray-300 py-3 dark:border-white/20 dark:text-white"
              >
                <div className="flex min-w-0 flex-col gap-1">
                  <p className="font-heading font-bold break-words capitalize">{fullName}</p>
                  {signedUp.has(member.id) && <Tag>Påmeldt</Tag>}
                </div>
                <Button
                  variant={isIn ? 'secondary' : 'primary'}
                  size="md"
                  aria-label={isIn ? `Angre innsjekk for ${fullName}` : `Sjekk inn ${fullName}`}
                  onClick={() => void toggle(member)}
                  className="flex-none"
                >
                  {isIn ? 'Sjekket inn ✓' : 'Sjekk inn'}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
