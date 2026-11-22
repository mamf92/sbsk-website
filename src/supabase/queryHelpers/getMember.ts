import { supabase } from '../client';

export interface Member {
  id: string;
  /** Null until the member has created an account. */
  supabase_id: string | null;
  email: string;
  name: string;
  surname: string;
  phone: string | null;
  is_admin: boolean;
  status: MemberStatus;
  /** ISO date (yyyy-mm-dd). */
  member_since: string;
  disabled_at: string | null;
  disabled_reason: string | null;
  birth_year: number | null;
  created_at: string;
  /** The membership card's QR payload. Readable by the member and the board only. */
  member_card_token: string;
}

export type MemberStatus = 'active' | 'disabled';

export async function getMember(supabaseId: string): Promise<Member> {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('supabase_id', supabaseId)
    .single();

  if (error) throw error;
  if (!data) throw new Error('Member not found');

  return data;
}
