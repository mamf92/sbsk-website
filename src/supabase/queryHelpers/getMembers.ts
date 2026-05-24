import { supabase } from '../client';
import type { Profile } from './getProfil';

export async function getMembers(): Promise<Profile[]> {
  const { data, error } = await supabase.from('profiles').select('*');

  if (error) throw error;
  if (!data) throw new Error('Profiles not found');

  return data;
}
