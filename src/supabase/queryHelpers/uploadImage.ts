import { supabase } from '../client';
import { resizeImage } from '../../utils/resizeImage';

/**
 * Re-encodes the photo in the browser (EXIF and GPS stripped, at most 512 × 512) and uploads it
 * under the member's own prefix. Throws `PhotoRejectedError` for a file that is not a photo.
 */
export default async function uploadImage(userId: string, file: File): Promise<string | null> {
  const photo = await resizeImage(file);
  const extension = photo.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `${userId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from('profile-images')
    .upload(path, photo, { contentType: photo.type });

  if (error) {
    console.error('Error uploading image:', error);
    return null;
  }

  return path;
}

/** Removes a photo the member no longer uses. Best effort: a leftover file is not an error. */
export async function removeImage(path: string): Promise<void> {
  const { error } = await supabase.storage.from('profile-images').remove([path]);
  if (error) console.error('Error removing image:', error);
}
