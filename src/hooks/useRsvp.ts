import { useEffect, useState } from 'react';
import type { CalendarEventTypes } from '../sanity/queryHelpers/events';
import { useAuth } from './authContext/authContext';
import {
  getEventAttendees,
  joinEvent,
  leaveEvent,
  type EventAttendee,
} from '../supabase/queryHelpers/eventParticipants';
import type { AvatarStackPerson } from '../components/ui/AvatarStack';

/**
 * Attendance for every event on the page, held in one place rather than per card, because the
 * "Mine kommende" filter has to see the same optimistic state the cards do.
 */
export function useRsvp(events: CalendarEventTypes[]) {
  const { isAuthenticated, authResolved, user } = useAuth();
  const [participants, setParticipants] = useState<Record<string, EventAttendee[]>>({});
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  // `event._id` values, joined into a string so the effect's dependency is stable across
  // re-renders that pass an equal-but-new `events` array — an array itself would never satisfy
  // `Object.is` and would re-fetch on every render.
  // Festival days are not event documents and have no participants to fetch.
  const eventIdsKey = events
    .filter((event) => !event.festivalDay)
    .map((event) => event._id)
    .join(',');

  useEffect(() => {
    if (!isAuthenticated) {
      setParticipants({});
      return;
    }
    let cancelled = false;
    const eventIds = eventIdsKey ? eventIdsKey.split(',') : [];
    getEventAttendees(eventIds)
      .then((byEvent) => {
        if (!cancelled) setParticipants(byEvent);
      })
      .catch((err) => {
        console.error('Error loading event participants:', err);
      });
    return () => {
      cancelled = true;
    };
  }, [eventIdsKey, isAuthenticated]);

  const attendeesOf = (eventId: string): EventAttendee[] => participants[eventId] ?? [];

  const isAttending = (eventId: string) =>
    !!user && attendeesOf(eventId).some((p) => p.supabase_id === user.supabase_id);

  async function toggle(eventId: string) {
    const supabaseId = user?.supabase_id;
    if (!user || !supabaseId || pending[eventId]) return;

    const previous = attendeesOf(eventId);
    const leaving = previous.some((p) => p.supabase_id === supabaseId);
    // The optimistic row for the member's own toggle, never sent: the server row is ids only.
    const participant: EventAttendee = {
      supabase_id: supabaseId,
      name: user.name,
      surname: user.surname,
      photo_url: user.photo_url ?? '',
      hidden: false,
    };

    setErrors((current) => ({ ...current, [eventId]: null }));
    setPending((current) => ({ ...current, [eventId]: true }));
    setParticipants((current) => ({
      ...current,
      [eventId]: leaving
        ? previous.filter((p) => p.supabase_id !== supabaseId)
        : [...previous, participant],
    }));

    try {
      if (leaving) {
        await leaveEvent(eventId, supabaseId);
      } else {
        await joinEvent(eventId, supabaseId);
      }
    } catch (err) {
      console.error('Error updating event participation:', err);
      setParticipants((current) => ({ ...current, [eventId]: previous }));
      setErrors((current) => ({
        ...current,
        [eventId]: leaving
          ? 'Kunne ikke melde deg av arrangementet. Prøv igjen senere.'
          : 'Kunne ikke melde deg på arrangementet. Prøv igjen senere.',
      }));
    } finally {
      setPending((current) => ({ ...current, [eventId]: false }));
    }
  }

  return {
    loggedIn: isAuthenticated,
    authResolved,
    attendeesOf,
    isAttending,
    toggle,
    pending,
    errors,
  };
}

/** Named attendees as avatars; hidden ones are only counted (`AvatarStack`'s `hiddenCount`). */
export function toAvatarPeople(participants: EventAttendee[]): AvatarStackPerson[] {
  return participants
    .filter((participant) => !participant.hidden)
    .map((participant) => ({
      name: [participant.name, participant.surname].filter(Boolean).join(' ').trim() || 'Medlem',
      src: participant.photo_url || undefined,
    }));
}
