import { supabase } from '../client';

/**
 * Disable or re-enable a member in the register. Disabling keeps their history; RLS gives a
 * disabled member's session nothing from the next request on, and the signup hook refuses a
 * new account. Banning the auth user and revoking sessions needs the service role and lands
 * with the `admin-members` edge function (phase 2 step 4).
 *
 * The database refuses to disable the last active admin (`last_admin`).
 */
export async function setMemberStatus(
  memberId: string,
  status: 'active' | 'disabled',
  reason?: string,
): Promise<void> {
  const patch =
    status === 'disabled'
      ? { status, disabled_at: new Date().toISOString(), disabled_reason: reason?.trim() || null }
      : { status, disabled_at: null, disabled_reason: null };

  const { error } = await supabase.from('members').update(patch).eq('id', memberId);
  if (error) throw error;
}
