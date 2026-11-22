import { redirect } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../supabase/client';
import { getProfile, type Profile } from '../supabase/queryHelpers/getProfile';
import { isActiveMember } from '../supabase/queryHelpers/memberAuth';
import { hasAcceptedCurrentTerms } from '../utils/legal';
import { memberPortalEnabled } from '../utils/featureFlags';

/**
 * The gate every member loader starts with (docs/plans/phase-3-members.md, "requireMember").
 * The database is the real boundary — RLS returns nothing to a disabled member — so this only
 * decides where to send someone:
 *
 * - signed out → `/login?reason=not_authenticated&neste=<next>`
 * - signed in, but not an active member (disabled by the board) → signed out, then
 *   `/login?reason=disabled`
 * - has not accepted the current privacy policy and terms → `/lag-medlemsprofil` (only once
 *   member sign-up is on; before that only the board signs in)
 * - otherwise → through, with the user and their profile
 */
export async function requireMember(
  next = '/medlemsportal',
): Promise<{ user: User; profile: Profile }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw redirect(`/login?reason=not_authenticated&neste=${encodeURIComponent(next)}`);
  }

  if (!(await isActiveMember())) {
    await supabase.auth.signOut();
    throw redirect('/login?reason=disabled');
  }

  const profile = await getProfile(user.id);
  if (memberPortalEnabled && !hasAcceptedCurrentTerms(profile.terms_accepted_version)) {
    throw redirect(`/lag-medlemsprofil?neste=${encodeURIComponent(next)}`);
  }

  return { user, profile };
}
