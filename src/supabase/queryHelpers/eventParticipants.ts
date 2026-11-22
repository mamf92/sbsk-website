import { supabase } from '../client';
import getImage from './getImage';

/**
 * Someone coming to an event, as other members may see them (`public.event_attendees`).
 * A member who chose not to show in attendee lists arrives with `hidden: true` and no id, name
 * or photo: they count, but nobody but themself and the board sees who they are.
 */
export interface EventAttendee {
  supabase_id: string | null;
  name: string | null;
  surname: string | null;
  /** Signed, browser-loadable URL resolved on read; empty when there is no photo. */
  photo_url: string;
  hidden: boolean;
}

interface AttendeeRow extends Omit<EventAttendee, 'photo_url'> {
  event_id: string;
  photo_url: string | null;
}

/** Attendees for a set of events, keyed by Sanity event `_id`. Active members only (RLS). */
export async function getEventAttendees(
  eventIds: string[],
): Promise<Record<string, EventAttendee[]>> {
  if (eventIds.length === 0) return {};

  const { data, error } = await supabase
    .from('event_attendees')
    .select('event_id, supabase_id, name, surname, photo_url, hidden')
    .in('event_id', eventIds);

  if (error) throw error;

  const rows = (data ?? []) as AttendeeRow[];
  // `photo_url` is a bucket-relative path, resolved to a fresh signed URL here.
  const resolved = await Promise.all(
    rows.map(async ({ event_id, photo_url, ...attendee }) => ({
      event_id,
      attendee: {
        ...attendee,
        photo_url: photo_url ? ((await getImage(photo_url)) ?? '') : '',
      },
    })),
  );

  const byEvent: Record<string, EventAttendee[]> = {};
  for (const { event_id, attendee } of resolved) {
    (byEvent[event_id] ??= []).push(attendee);
  }
  return byEvent;
}

/**
 * The ids of every event this member has signed up for. Filtered explicitly: for the board
 * (admin_session) RLS returns everyone's rows.
 */
export async function getMySignups(supabaseId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('event_participants')
    .select('event_id')
    .eq('supabase_id', supabaseId);
  if (error) throw error;
  return (data ?? []).map((row: { event_id: string }) => row.event_id);
}

/**
 * Sign up as yourself. The row carries no display data, so RLS (`supabase_id = auth.uid()`,
 * active members only) is the whole check; no edge function is needed (plan decision 7).
 */
export async function joinEvent(eventId: string, supabaseId: string): Promise<void> {
  const { error } = await supabase
    .from('event_participants')
    .insert({ event_id: eventId, supabase_id: supabaseId });
  // 23505: already signed up (another tab, a double tap). The outcome the member wanted.
  if (error && error.code !== '23505') throw error;
}

export async function leaveEvent(eventId: string, supabaseId: string): Promise<void> {
  const { error } = await supabase
    .from('event_participants')
    .delete()
    .eq('event_id', eventId)
    .eq('supabase_id', supabaseId);
  if (error) throw error;
}

/** Whether the member shows by name in attendee lists and the member directory. */
export async function setShowInAttendeeLists(supabaseId: string, show: boolean): Promise<void> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ show_in_attendee_lists: show })
    .eq('supabase_id', supabaseId)
    .select('id');
  if (error) throw error;
  if (!data || data.length === 0) throw new Error('Profile not updated');
}

/** How many are coming to each event, hidden members included. No names, no photos. */
export async function getAttendeeCounts(eventIds: string[]): Promise<Record<string, number>> {
  if (eventIds.length === 0) return {};
  const { data, error } = await supabase
    .from('event_attendees')
    .select('event_id')
    .in('event_id', eventIds);
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const { event_id } of (data ?? []) as { event_id: string }[]) {
    counts[event_id] = (counts[event_id] ?? 0) + 1;
  }
  return counts;
}
