import { supabase } from '../client';

/**
 * GDPR rights on Min side (docs/plans/gdpr.md steps 2–3): SECURITY DEFINER RPCs in
 * `20261122060000_gdpr_export_and_erasure.sql`, no edge functions.
 */

/** Everything the club holds about the signed-in member. One per ten minutes (`rate_limited`). */
export async function exportMyData(): Promise<Record<string, unknown>> {
  const { data, error } = await supabase.rpc('export_my_data');
  if (error) throw error;
  return data as Record<string, unknown>;
}

/**
 * Raises what would stop the erasure (`reauth_required`, `last_admin`, `not_member`) without
 * changing anything, so the page asks before it removes a single photo.
 */
export async function checkCanEraseMyAccount(): Promise<void> {
  const { error } = await supabase.rpc('erase_my_account_check');
  if (error) throw error;
}

/**
 * The member's own photos, before the erasure, while the login still exists: Supabase refuses
 * direct deletes from storage tables, so SQL cannot. The profile stops pointing at the photo
 * first, so a failure after this leaves no broken picture.
 */
export async function removeMyPhotos(userId: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ photo_url: null })
    .eq('supabase_id', userId);
  if (error) throw error;
  await removePhotoFolder(userId);
}

/** Every file under one login's photo prefix: the member's own, or one the board erased. */
async function removePhotoFolder(userId: string): Promise<void> {
  const bucket = supabase.storage.from('profile-images');
  const { data, error } = await bucket.list(userId, { limit: 1000 });
  if (error) throw error;
  const paths = (data ?? []).map((file) => `${userId}/${file.name}`);
  if (paths.length === 0) return;
  const { error: removeError } = await bucket.remove(paths);
  if (removeError) throw removeError;
}

/** Deletes the account. Raises `reauth_required` without a fresh sign-in, `last_admin`. */
export async function eraseMyAccount(confirm: string): Promise<void> {
  const { error } = await supabase.rpc('erase_my_account', { p_confirm: confirm });
  if (error) throw error;
}

/**
 * The nightly retention jobs, run when the board opens the member list (no pg_cron). Members it
 * erased leave a photo folder the database cannot delete; the board's session removes it.
 */
export async function runRetention(): Promise<void> {
  const { data, error } = await supabase.rpc('run_retention');
  if (error) throw error;
  const logins = (data as { erasedLogins?: string[] } | null)?.erasedLogins ?? [];
  for (const login of logins) {
    await removePhotoFolder(login).catch((err: unknown) =>
      console.error('Could not remove the photos of an erased member:', err),
    );
  }
}

/** `sbsk-mine-data-2026-11-22.json`, in the Oslo date. */
export function exportFileName(now: Date = new Date()): string {
  const day = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Oslo' }).format(now);
  return `sbsk-mine-data-${day}.json`;
}
