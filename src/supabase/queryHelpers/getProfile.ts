import { supabase } from '../client';
import getImage from './getImage';

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
  /** Signed, browser-loadable URL resolved fresh on every fetch — do not persist it. */
  photo_url: string | null;
  /** Bucket-relative storage path backing `photo_url` — round-trip this into `editProfile`. */
  photo_path: string | null;
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

  const photo_path: string | null = data.photo_url;
  const photo_url = photo_path ? await getImage(photo_path) : null;

  return { ...data, photo_path, photo_url };
}
