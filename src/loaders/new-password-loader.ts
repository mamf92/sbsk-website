import { redirect } from 'react-router-dom';
import { supabase } from '../supabase/client';
import { getAssurance } from '../supabase/queryHelpers/mfa';

/**
 * `/nytt-passord`. supabase-js turns the recovery link's `#access_token=…` into a session while
 * the client initialises, and `getSession()` waits for that. No session means the link was
 * expired, used or never there. Supabase demands aal2 to change the password of an account
 * with a second factor, so those users are sent through `/to-faktor` first.
 */
export async function newPasswordLoader() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return { linkValid: false };

  const { currentLevel, nextLevel } = await getAssurance().catch(() => ({
    currentLevel: null,
    nextLevel: null,
  }));
  if (currentLevel === 'aal1' && nextLevel === 'aal2') {
    throw redirect(`/to-faktor?neste=${encodeURIComponent('/nytt-passord')}`);
  }
  return { linkValid: true };
}
