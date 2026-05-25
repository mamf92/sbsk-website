import { v4 as uuidv4 } from 'uuid';
import getImage from './getImage';
import { supabase } from '../client';

export default async function uploadImage(userId: string, file: File): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('profile-images')
    .upload(userId + '/' + uuidv4(), file);

  if (data) {
    return getImage(userId);
  } else {
    console.error('Error uploading image:', error);
    return null;
  }
}
