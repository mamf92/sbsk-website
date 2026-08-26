import { supabase } from '../client';

export default async function uploadImage(userId: string, file: File): Promise<string | null> {
  const path = `${userId}/${crypto.randomUUID()}`;
  const { error } = await supabase.storage.from('profile-images').upload(path, file);

  if (error) {
    console.error('Error uploading image:', error);
    return null;
  }

  return path;
}
