import { redirect } from 'react-router-dom';
import { supabase } from '../supabase/client';
import { getProfile, type Profile } from '../supabase/queryHelpers/getProfile';
import { hasAcceptedCurrentTerms } from '../utils/legal';

/**
 * `/lag-medlemsprofil`: signed out, the page asks for an email and a code; signed in, it shows
 * the first-time setup for the profile it returns here. A member who has already finished
 * setup for the current terms goes straight to Min side.
 */
export async function onboardingLoader(): Promise<{ profile: Profile | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { profile: null };
  const profile = await getProfile(user.id).catch(() => null);
  if (profile && hasAcceptedCurrentTerms(profile.terms_accepted_version)) {
    throw redirect('/medlemsportal');
  }
  return { profile };
}
