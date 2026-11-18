import { redirect } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../supabase/client';
import { isBoardAdmin } from '../supabase/queryHelpers/isBoardAdmin';
import { getAssurance } from '../supabase/queryHelpers/mfa';

/**
 * The gate every admin loader starts with (security plan S2a step 4). The database is the real
 * boundary — every admin policy asks `admin_session()`, which needs an aal2 session — so this
 * only decides where to send someone who would otherwise get an empty page:
 *
 * - signed out → `/login?reason=not_authenticated`
 * - signed in, not an admin → `/medlemsportal?reason=not_admin`
 * - admin with no authenticator yet → `/to-faktor/oppsett`
 * - admin with an authenticator, session still at aal1 → `/to-faktor`
 * - admin at aal2 → through, with the user
 *
 * `next` is where the 2FA pages send the admin afterwards.
 */
export async function requireAdminSession(next = '/styreportal'): Promise<User> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw redirect('/login?reason=not_authenticated');
  }

  if (!(await isBoardAdmin())) {
    throw redirect('/medlemsportal?reason=not_admin');
  }

  const { currentLevel, nextLevel } = await getAssurance();
  if (currentLevel === 'aal2') return user;

  const query = `?neste=${encodeURIComponent(next)}`;
  throw redirect(nextLevel === 'aal2' ? `/to-faktor${query}` : `/to-faktor/oppsett${query}`);
}

/**
 * A `neste` value from the query string, accepted only when it is a path inside this app.
 * Anything else (`//evil.example`, `https://…`, `javascript:`) falls back to the board portal,
 * so the 2FA pages cannot be used as an open redirect.
 */
export function safeNextPath(value: string | null): string {
  if (value && /^\/(?![/\\])/.test(value)) return value;
  return '/styreportal';
}
