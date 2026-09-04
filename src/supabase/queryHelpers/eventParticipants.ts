import type { Profile } from './getProfile';
import { supabase } from '../client';
import getImage from './getImage';

export interface EventParticipant {
  supabase_id: string;
  name: string;
  surname: string;
  photo_url: string;
}

interface EventParticipantRow extends EventParticipant {
  event_id: string;
}

/** Builds the optimistic local entry for the member's own RSVP toggle — never sent to the
 *  server. `user.photo_url` is already a resolved signed URL (see `getProfile`), matching what
 *  `getEventParticipants` resolves stored rows to below. */
export const createParticipantFromProfile = (user: Profile): EventParticipant => ({
  supabase_id: user.supabase_id,
  name: user.name ?? '',
  surname: user.surname ?? '',
  photo_url: user.photo_url ?? '',
});

/** Attendees for a set of events, keyed by Sanity event `_id`. RLS restricts
 *  `event_participants` to authenticated members, so a signed-out caller gets `{}` back rather
 *  than an error. */
export async function getEventParticipants(
  eventIds: string[],
): Promise<Record<string, EventParticipant[]>> {
  if (eventIds.length === 0) return {};

  const { data, error } = await supabase
    .from('event_participants')
    .select('event_id, supabase_id, name, surname, photo_url')
    .in('event_id', eventIds);

  if (error) throw error;

  const rows = (data ?? []) as EventParticipantRow[];
  // Stored `photo_url` is a bucket-relative path, not a URL — resolved to a fresh signed URL on
  // read, the same way `getProfile` resolves a member's own photo.
  const resolved = await Promise.all(
    rows.map(async ({ event_id, ...participant }) => ({
      event_id,
      participant: {
        ...participant,
        photo_url: participant.photo_url ? ((await getImage(participant.photo_url)) ?? '') : '',
      },
    })),
  );

  const byEvent: Record<string, EventParticipant[]> = {};
  for (const { event_id, participant } of resolved) {
    (byEvent[event_id] ??= []).push(participant);
  }
  return byEvent;
}

/** Both calls carry only `action` and `eventId` — the edge function derives the acting member
 *  from the verified JWT and looks up their own name/surname/photo_url server-side, so a caller
 *  cannot claim another member's identity or display data (issue #96). */
export async function addParticipantToEvent(eventId: string): Promise<void> {
  const { error } = await supabase.functions.invoke('update-event-participants', {
    body: { action: 'join', eventId },
  });
  if (error) throw error;
}

export async function removeParticipantFromEvent(eventId: string): Promise<void> {
  const { error } = await supabase.functions.invoke('update-event-participants', {
    body: { action: 'leave', eventId },
  });
  if (error) throw error;
}
