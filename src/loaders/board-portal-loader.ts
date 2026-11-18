import { getProfile } from '../supabase/queryHelpers/getProfile';
import { getMembers } from '../supabase/queryHelpers/getMembers';
import { requireAdminSession } from './requireAdminSession';

// Admin is decided by the database RPCs (member_is_admin, then the session's assurance level)
// in requireAdminSession, not inferred from a permission error on a table read: since the
// register gained a "read your own row" policy, a non-admin's read succeeds with one row.
export async function boardPortalLoader() {
  const user = await requireAdminSession('/styreportal');
  const [profile, members] = await Promise.all([getProfile(user.id), getMembers()]);
  return { profile, members };
}
