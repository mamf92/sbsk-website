import { supabase } from '../client';

/**
 * Sign-in with a one-time code sent by email (docs/plans/phase-3-members.md, decisions 2–4).
 *
 * `shouldCreateUser: true` on purpose: the first code a listed member asks for creates their
 * login. The database decides who may have one — `hook_restrict_signup_by_email_list()` refuses
 * any email that is not an active row in `members` — so the client asks freely and maps the
 * refusal to a plain message (`errorMessage.ts`).
 */
export async function sendSignInCode(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: { shouldCreateUser: true },
  });
  if (error) throw error;
}

/** Exchanges the emailed code for a session. */
export async function verifySignInCode(email: string, code: string): Promise<void> {
  const { data, error } = await supabase.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token: code.replace(/\s+/g, ''),
    type: 'email',
  });
  if (error) throw error;
  if (!data.session) throw new Error('Token has expired or is invalid');
}

/** Whether the signed-in user is an active row on the register. False for disabled members. */
export async function isActiveMember(): Promise<boolean> {
  const { data, error } = await supabase.rpc('member_is_active');
  if (error) throw error;
  return data === true;
}

/** First-time setup: the member's name and their acceptance of the current legal texts. */
export async function completeOnboarding(values: {
  supabaseId: string;
  name: string;
  surname: string;
  termsVersion: string;
}): Promise<void> {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      name: values.name.trim(),
      surname: values.surname.trim() || null,
      terms_accepted_version: values.termsVersion,
    })
    .eq('supabase_id', values.supabaseId)
    .select('id');
  if (error) throw error;
  // RLS filters an update it refuses down to zero rows, without an error.
  if (!data || data.length === 0) throw new Error('Profile not updated');
}

/** Sets or changes the password of the signed-in member. Optional: a code always works. */
export async function setPassword(password: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

/** Ends every session of this account, on every device, including this one. */
export async function signOutEverywhere(): Promise<void> {
  const { error } = await supabase.auth.signOut({ scope: 'global' });
  if (error) throw error;
}
