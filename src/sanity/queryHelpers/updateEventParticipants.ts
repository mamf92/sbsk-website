import type { Profile } from '../../supabase/queryHelpers/getProfile';
import { supabase } from '../../supabase/client';

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
  const { error } = await supabase.functions.invoke('update-event-participants', {
    body: { action: 'join', eventId, participant },
  });
  if (error) throw error;
}

export async function removeParticipantFromEvent({
  eventId,
  supabaseId,
}: RemoveParticipantProps): Promise<void> {
  const { error } = await supabase.functions.invoke('update-event-participants', {
    body: { action: 'leave', eventId, supabaseId },
  });
  if (error) throw error;
}
