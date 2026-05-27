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

  const { data: publicData } = await supabase.storage
    .from('profile-images')
    .getPublicUrl(`${userId}/${data[0].name}`);
  return publicData?.publicUrl || null;
}
