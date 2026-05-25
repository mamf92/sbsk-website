import { supabase } from '../client';
import type { Member } from './getMember';

export async function getMembers(): Promise<Member[]> {
  const { data, error } = await supabase.from('members').select('*');

  if (error) throw error;
  if (!data) throw new Error('Members not found');

  return data;
}
