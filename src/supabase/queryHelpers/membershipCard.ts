import { supabase } from '../client';
import type { MemberStatus } from './getMember';

export interface CardLookup {
  memberId: string;
  name: string;
  surname: string;
  status: MemberStatus;
  seasonPaid: boolean;
}

/** "Lag ny kode": a fresh card token for the signed-in member; the old one stops working. */
export async function rotateCardToken(): Promise<string> {
  const { data, error } = await supabase.rpc('rotate_member_card_token');
  if (error) throw error;
  return data as string;
}

/** The board's scan at the door (`admin_session()` only). Null for a code that finds nobody. */
export async function lookupCard(token: string): Promise<CardLookup | null> {
  const { data, error } = await supabase.rpc('admin_member_by_card_token', { p_token: token });
  if (error) throw error;
  const row = (data as Record<string, unknown>[] | null)?.[0];
  if (!row) return null;
  return {
    memberId: row.member_id as string,
    name: row.name as string,
    surname: (row.surname as string) ?? '',
    status: row.status as MemberStatus,
    seasonPaid: row.season_paid === true,
  };
}
