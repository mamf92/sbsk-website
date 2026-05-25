import { supabase } from '../client';

export interface Profile {
  id: string;
  supabase_id: string;
  email: string;
  name: string | null;
  surname: string | null;
  address: string | null;
  postcode: string | null;
  city: string | null;
  created_at: string;
  photo_url: string | null;
  bio: string | null;
}

export async function getProfile(supabaseId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('supabase_id', supabaseId)
    .single();

  if (error) throw error;
  if (!data) throw new Error('Profile not found');

  return data;
}
