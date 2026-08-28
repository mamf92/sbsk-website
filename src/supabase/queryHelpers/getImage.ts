import { supabase } from '../client';

const SIGNED_URL_TTL_SECONDS = 3600;

export default async function getImage(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('profile-images')
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  if (error) {
    console.error('Error creating signed image URL:', error);
    return null;
  }

  return data?.signedUrl || null;
}
