import getImage from './getImage';
import { supabase } from '../client';

export default async function uploadImage(userId: string, file: File): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('profile-images')
    .upload(userId + '/' + crypto.randomUUID(), file);

  if (data) {
    return getImage(userId);
  } else {
    console.error('Error uploading image:', error);
    return null;
  }
}
