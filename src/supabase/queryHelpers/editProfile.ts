import { supabase } from '../client';

export type ProfileFormValues = {
  id: string;
  supabase_id: string;
  name: string;
  surname: string | null;
  photo_url: string | File | null;
  bio: string | null;
};

export async function editProfile(profile: ProfileFormValues) {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      name: profile.name,
      surname: profile.surname,
      photo_url: profile.photo_url,
      bio: profile.bio,
    })
    .select()
    .eq('supabase_id', profile.supabase_id)
    .single();

  if (error) throw error;
  return data;
}
