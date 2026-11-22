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

/** Whether the last real sign-in is under five minutes old, as erasure requires. */
export async function hasFreshSignIn(): Promise<boolean> {
  const { data, error } = await supabase.rpc('gdpr_fresh_sign_in');
  if (error) throw error;
  return data === true;
}

/**
 * Removes every file under the member's own photo prefix. Runs before the erasure, while the
 * login still exists: Supabase refuses direct deletes from storage tables, so SQL cannot.
 */
export async function removeMyPhotos(userId: string): Promise<void> {
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

/** The nightly retention jobs, run when the board opens the member list (no pg_cron). */
export async function runRetention(): Promise<void> {
  const { error } = await supabase.rpc('run_retention');
  if (error) throw error;
}

/** `sbsk-mine-data-2026-11-22.json`, in the Oslo date. */
export function exportFileName(now: Date = new Date()): string {
  const day = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Oslo' }).format(now);
  return `sbsk-mine-data-${day}.json`;
}
