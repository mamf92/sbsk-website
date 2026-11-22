import { supabase } from '../client';

export interface MyActivity {
  /** Check-ins at the door. Null when the caller has no register row. */
  checkIns: number | null;
  /** Events signed up for. Null when the count could not be read. */
  signups: number | null;
}

/** Counts for the portal band's stat tiles. RLS limits both tables to the caller's own rows. */
export async function getMyActivity(
  supabaseId: string,
  memberId: string | null,
): Promise<MyActivity> {
  const [signups, checkIns] = await Promise.all([
    supabase
      .from('event_participants')
      .select('id', { count: 'exact', head: true })
      .eq('supabase_id', supabaseId),
    memberId
      ? supabase
          .from('attendance')
          .select('id', { count: 'exact', head: true })
          .eq('member_id', memberId)
      : Promise.resolve({ count: null, error: null }),
  ]);

  if (signups.error) throw signups.error;
  if (checkIns.error) throw checkIns.error;

  return { signups: signups.count ?? 0, checkIns: memberId ? (checkIns.count ?? 0) : null };
}

/** The categories of the member's own check-ins (RLS: own rows only), for suggestions. */
export async function getMyCheckInCategories(memberId: string): Promise<(string | null)[]> {
  const { data, error } = await supabase
    .from('attendance')
    .select('event_category')
    .eq('member_id', memberId);
  if (error) throw error;
  return (data ?? []).map((row: { event_category: string | null }) => row.event_category);
}
