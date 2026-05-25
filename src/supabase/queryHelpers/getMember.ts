import { supabase } from '../client';

export interface Member {
  id: string;
  supabase_id: string;
  email: string;
  name: string | null;
  surname: string | null;
  address: string | null;
  postcode: string | null;
  phone: string | null;
  city: string | null;
  is_admin: boolean;
  created_at: string;
}

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
