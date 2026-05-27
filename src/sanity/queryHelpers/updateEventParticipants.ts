import { client } from '../client';
import type { Profile } from '../../supabase/queryHelpers/getProfile';

export interface CalendarEventParticipantTypes {
  _key: string;
  supabase_id: string;
  name: string;
  surname: string;
  photo_url: string;
}

interface AddParticipantProps {
  eventId: string;
  participant: Omit<CalendarEventParticipantTypes, '_key'>;
}

interface RemoveParticipantProps {
  eventId: string;
  supabaseId: string;
}

interface EventParticipantsSnapshot {
  participants?: { supabase_id?: string }[];
}

export const createParticipantFromProfile = (
  user: Profile,
): Omit<CalendarEventParticipantTypes, '_key'> => ({
  supabase_id: user.supabase_id,
  name: user.name ?? '',
  surname: user.surname ?? '',
  photo_url: user.photo_url ?? '',
});

export async function addParticipantToEvent({
  eventId,
  participant,
}: AddParticipantProps): Promise<void> {
  const currentEvent = await client.fetch<EventParticipantsSnapshot>(
    '*[_id == $eventId][0]{participants}',
    { eventId },
  );

  const alreadyJoined = currentEvent?.participants?.some(
    (existing) => existing.supabase_id === participant.supabase_id,
  );

  if (alreadyJoined) {
    return;
  }

  await client
    .patch(eventId)
    .setIfMissing({ participants: [] })
    .append('participants', [
      {
        _key: participant.supabase_id,
        ...participant,
      },
    ])
    .commit();
}

export async function removeParticipantFromEvent({
  eventId,
  supabaseId,
}: RemoveParticipantProps): Promise<void> {
  await client
    .patch(eventId)
    .unset([`participants[_key=="${supabaseId}"]`])
    .commit();
}
