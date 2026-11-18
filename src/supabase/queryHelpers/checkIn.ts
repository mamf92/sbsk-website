import { supabase } from '../client';

// Door check-in (phase 2 step 5). Four calls on two tables that only make sense together, so
// one module, like mfa.ts. All admin-only in RLS.

export interface CheckInEvent {
  id: string;
  /** ISO date of the event, snapshotted so statistics never depend on Sanity. */
  date: string;
  category: string | null;
}

/** Member ids already checked in at an event. */
export async function getCheckedIn(eventId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('attendance')
    .select('member_id')
    .eq('event_id', eventId);
  if (error) throw error;
  return (data ?? []).map((row) => row.member_id as string);
}

export async function checkInMember(event: CheckInEvent, memberId: string): Promise<void> {
  const { error } = await supabase.from('attendance').insert({
    event_id: event.id,
    event_date: event.date,
    event_category: event.category,
    member_id: memberId,
  });
  // Already checked in (another door volunteer got there first) is success, not a failure.
  if (error && error.code !== '23505') throw error;
}

export async function undoCheckIn(eventId: string, memberId: string): Promise<void> {
  const { error } = await supabase
    .from('attendance')
    .delete()
    .eq('event_id', eventId)
    .eq('member_id', memberId);
  if (error) throw error;
}

export async function getGuestCount(eventId: string): Promise<number> {
  const { data, error } = await supabase
    .from('event_headcounts')
    .select('guests')
    .eq('event_id', eventId)
    .maybeSingle();
  if (error) throw error;
  return data?.guests ?? 0;
}

export async function setGuestCount(event: CheckInEvent, guests: number): Promise<void> {
  const { error } = await supabase
    .from('event_headcounts')
    .upsert({ event_id: event.id, event_date: event.date, guests }, { onConflict: 'event_id' });
  if (error) throw error;
}
