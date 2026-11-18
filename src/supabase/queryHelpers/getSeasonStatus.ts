import { supabase } from '../client';

export interface SeasonStatus {
  paid: boolean;
  paidAt: string | null;
}

/** This season's payment status for every member the caller may see (all of them, for an
 *  admin at aal2), keyed by member id. Reads the `member_season_status` view. */
export async function getSeasonStatus(): Promise<Record<string, SeasonStatus>> {
  const { data, error } = await supabase
    .from('member_season_status')
    .select('member_id, paid, paid_at');

  if (error) throw error;

  const byMember: Record<string, SeasonStatus> = {};
  for (const row of data ?? []) {
    byMember[row.member_id] = { paid: row.paid === true, paidAt: row.paid_at ?? null };
  }
  return byMember;
}
