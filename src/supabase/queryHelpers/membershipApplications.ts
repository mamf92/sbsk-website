import { supabase } from '../client';

export interface ApplicationInput {
  name: string;
  surname: string;
  email: string;
  birthYear: number | null;
  message: string | null;
  privacyVersion: string;
}

/**
 * Sends a "Bli medlem" application. No `.select()`: an applicant has no read grant. A second
 * open application from the same address (unique violation) is reported as sent, like the
 * first: the board already has it, and saying otherwise would tell anyone which addresses
 * have applied.
 */
export async function createApplication(input: ApplicationInput): Promise<void> {
  const { error } = await supabase.from('membership_applications').insert({
    name: input.name,
    surname: input.surname,
    email: input.email,
    birth_year: input.birthYear,
    message: input.message,
    privacy_version: input.privacyVersion,
  });
  if (error && error.code !== '23505') throw error;
}

export interface Application {
  id: string;
  created_at: string;
  name: string;
  surname: string;
  email: string;
  birth_year: number | null;
  message: string | null;
}

/** Open applications, oldest first, for the board (RLS: `admin_session()`). */
export async function getPendingApplications(): Promise<Application[]> {
  const { data, error } = await supabase
    .from('membership_applications')
    .select('id, created_at, name, surname, email, birth_year, message')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Application[];
}

/** Adds the applicant to the register. Returns the new member's id. */
export async function approveApplication(id: string): Promise<string> {
  const { data, error } = await supabase.rpc('approve_application', { p_id: id });
  if (error) throw error;
  return data as string;
}

export async function rejectApplication(id: string): Promise<void> {
  const { error } = await supabase.rpc('reject_application', { p_id: id });
  if (error) throw error;
}

/** Retention for decided applications (gdpr.md); run when the board opens the member list. */
export async function purgeExpiredApplications(): Promise<void> {
  const { error } = await supabase.rpc('purge_expired_applications');
  if (error) throw error;
}
