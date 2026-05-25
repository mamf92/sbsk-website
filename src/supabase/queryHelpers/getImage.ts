import { supabase } from '../client';

export default async function getImage(userId: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('profile-images')
    .list(userId + '/', { limit: 1, offset: 0, sortBy: { column: 'name', order: 'asc' } });

  if (error) {
    console.error('Error fetching image:', error);
    return null;
  }

  if (!data || data.length === 0) {
    return null;
  }

  const { data: signedData, error: signedError } = await supabase.storage
    .from('profile-images')
    .createSignedUrl(`${userId}/${data[0].name}`, 60 * 60);

  if (signedError) {
    console.error('Error creating signed URL:', signedError);
    return null;
  }
  return signedData?.signedUrl ?? null;
}
