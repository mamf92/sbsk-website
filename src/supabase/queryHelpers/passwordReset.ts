import { supabase } from '../client';

/** Where the recovery email sends the visitor: the set-new-password page, under the site's base
 *  path (`/` locally, `/sbsk-website/` on Pages). Must be on Supabase Auth's redirect allow-list. */
export function passwordResetRedirectUrl(): string {
  const base = import.meta.env.VITE_BASE ?? '/';
  return new URL(`${base.replace(/\/?$/, '/')}nytt-passord`, window.location.origin).toString();
}

/**
 * Ask Supabase to email a recovery link. Supabase answers the same whether or not the address
 * has an account, and the caller must not reveal the difference either (security plan: no
 * account enumeration), so only a genuine failure (rate limit, network) throws.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: passwordResetRedirectUrl(),
  });
  if (error) throw error;
}

/** Sets the password of the signed-in (recovery) session. */
export async function updatePassword(password: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}
