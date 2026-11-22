import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert } from '../../ui/Alert';
import { Button } from '../../ui/Buttons';
import EmptyState from '../../ui/EmptyState';
import { Input } from '../../ui/Input';
import { StatTile } from '../../ui/StatTile';
import { Tag } from '../../ui/Tag';
import { linkClassesInherit } from '../../ui/Link';
import CardScanner from './CardScanner';
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
import { lookupCard, type CardLookup } from '../../../supabase/queryHelpers/membershipCard';
import { compareMemberNames, currentSeason, memberMatches } from '../../../utils/membership';

type AdminCheckInSectionProps = {
  event: AdminEvent;
  members: Member[];
  checkedIn: string[];
  guests: number;
  signups: AdminSignup[];
  /** For tests; the real lookup otherwise. */
  lookup?: (token: string) => Promise<CardLookup | null>;
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
  lookup = lookupCard,
}: AdminCheckInSectionProps) {
  const target: CheckInEvent = useMemo(
    () => ({ id: event._id, date: osloDate(event), category: event.category }),
    [event],
  );
  const [checkedIn, setCheckedIn] = useState(() => new Set(initialCheckedIn));
  const [guests, setGuests] = useState(initialGuests);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  // The result of the last card scan, so the door sees who it was without reading the list.
  const [scanned, setScanned] = useState<{ tone: 'success' | 'info'; text: string } | null>(null);
  // Members with a write in flight. Their button is disabled until it settles, so an undo
  // cannot race the check-in it undoes.
  const [pending, setPending] = useState<ReadonlySet<string>>(() => new Set());
  // Guest taps are written in order, each with the absolute count, so the last write wins. Only
  // when the last queued write fails does the counter fall back to the last saved value.
  const guestWrites = useRef<Promise<void>>(Promise.resolve());
  const guestsQueued = useRef(0);
  const guestsSaved = useRef(initialGuests);

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

  const toggle = async (member: Member): Promise<boolean> => {
    if (pending.has(member.id)) return false;
    const wasIn = checkedIn.has(member.id);
    const setBusy = (busy: boolean) =>
      setPending((prev) => {
        const next = new Set(prev);
        if (busy) next.add(member.id);
        else next.delete(member.id);
        return next;
      });
    const flip = (on: boolean) =>
      setCheckedIn((prev) => {
        const next = new Set(prev);
        if (on) next.add(member.id);
        else next.delete(member.id);
        return next;
      });

    setError(null);
    setBusy(true);
    flip(!wasIn);
    try {
      if (wasIn) await undoCheckIn(target.id, member.id);
      else await checkInMember(target, member.id);
      return true;
    } catch {
      flip(wasIn);
      setError(
        `Kunne ikke ${wasIn ? 'angre innsjekken for' : 'sjekke inn'} ${member.name}. Sjekk nettet og prøv igjen.`,
      );
      return false;
    } finally {
      setBusy(false);
    }
  };

  const checkInByCard = async (token: string) => {
    setError(null);
    setScanned(null);
    let found: CardLookup | null;
    try {
      found = await lookup(token);
    } catch {
      setError('Kunne ikke slå opp medlemskortet. Sjekk nettet og prøv igjen, eller søk på navn.');
      return;
    }
    const member = found ? members.find((m) => m.id === found.memberId) : undefined;
    if (!found || !member) {
      setError('Fant ingen med den koden. Søk på navn, eller be medlemmet åpne kortet på nytt.');
      return;
    }
    const fullName = `${member.name} ${member.surname}`.trim();
    if (found.status !== 'active') {
      setError(`${fullName} er deaktivert og kan ikke sjekkes inn.`);
      return;
    }
    const unpaid = found.seasonPaid ? '' : ` Ikke betalt for ${currentSeason()}.`;
    if (checkedIn.has(member.id)) {
      setScanned({ tone: 'info', text: `${fullName} er allerede sjekket inn.${unpaid}` });
      return;
    }
    if (await toggle(member)) {
      setScanned({ tone: 'success', text: `${fullName} er sjekket inn.${unpaid}` });
    }
  };

  const changeGuests = (delta: number) => {
    const before = guests;
    const after = Math.min(MAX_GUESTS, Math.max(0, before + delta));
    if (after === before) return;
    setError(null);
    setGuests(after);
    guestsQueued.current += 1;
    guestWrites.current = guestWrites.current.then(async () => {
      try {
        await setGuestCount(target, after);
        guestsSaved.current = after;
      } catch {
        // A later queued write still carries the newest count; only the last one decides.
        if (guestsQueued.current === 1) {
          setGuests(guestsSaved.current);
          setError('Kunne ikke lagre antall gjester. Prøv igjen.');
        }
      } finally {
        guestsQueued.current -= 1;
      }
    });
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

      <div className="flex flex-col gap-2">
        <CardScanner onCode={(token) => void checkInByCard(token)} />
        {scanned && <Alert tone={scanned.tone}>{scanned.text}</Alert>}
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
                  disabled={pending.has(member.id)}
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
