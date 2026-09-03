import { redirect } from 'react-router-dom';
import { getProfile } from '../supabase/queryHelpers/getProfile';
import { getMembers } from '../supabase/queryHelpers/getMembers';
import { supabase } from '../supabase/client';

// RLS denies a non-admin's `select` on `members` outright rather than answering with zero rows
// (there is no policy granting them any access at all), so a real Postgres/PostgREST error
// reaches here with either the SQLSTATE `42501` or an HTTP 401/403, and the message says
// "permission denied". Checked broadly on purpose: which of those a given failure carries
// depends on the client and on whether it went through PostgREST at all (see the e2e stub in
// e2e/fixtures/supabase.ts, which answers with a bare `403`).
function isPermissionDenied(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = 'code' in error ? String((error as { code?: unknown }).code) : '';
  const message = 'message' in error ? String((error as { message?: unknown }).message) : '';
  return code === '42501' || code === '401' || code === '403' || /permission denied/i.test(message);
}

export async function boardPortalLoader() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw redirect('/login?reason=not_authenticated');
  }

  const profile = await getProfile(user.id);

  try {
    const members = await getMembers();
    return { profile, members };
  } catch (error) {
    // A signed-in member without admin rights is not a fault — bounce to the member portal
    // with a reason it can explain (#82). Anything else (a genuine outage, say) is a fault and
    // should reach the shared error boundary like any other loader failure, not be silently
    // mislabelled as "you're not an admin".
    if (isPermissionDenied(error)) {
      throw redirect('/medlemsportal?reason=not_admin');
    }
    throw error;
  }
}
