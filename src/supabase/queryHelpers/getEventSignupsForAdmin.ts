import { supabase } from '../client';

export interface AdminSignup {
  memberId: string | null;
  supabaseId: string;
  displayName: string;
  email: string | null;
  /** `rsvp` today; `registration` once paid registrations exist (event-pages plan). */
  source: 'rsvp' | 'registration';
  paymentStatus: string | null;
  createdAt: string;
}

/** Who signed up for each event, keyed by Sanity `_id`, from the `admin_event_signups` view.
 *  The view returns nothing unless the caller is an admin at aal2. */
export async function getEventSignupsForAdmin(
  eventIds: string[],
): Promise<Record<string, AdminSignup[]>> {
  if (eventIds.length === 0) return {};

  const { data, error } = await supabase
    .from('admin_event_signups')
    .select(
      'event_id, member_id, supabase_id, display_name, email, source, payment_status, created_at',
    )
    .in('event_id', eventIds);

  if (error) throw error;

  const byEvent: Record<string, AdminSignup[]> = {};
  for (const row of data ?? []) {
    (byEvent[row.event_id] ??= []).push({
      memberId: row.member_id ?? null,
      supabaseId: row.supabase_id,
      displayName: row.display_name ?? row.email ?? 'Ukjent medlem',
      email: row.email ?? null,
      source: row.source,
      paymentStatus: row.payment_status ?? null,
      createdAt: row.created_at,
    });
  }
  for (const list of Object.values(byEvent)) {
    list.sort((a, b) => a.displayName.localeCompare(b.displayName, 'nb'));
  }
  return byEvent;
}
