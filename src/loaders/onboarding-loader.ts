import { redirect, type LoaderFunctionArgs } from 'react-router-dom';
import { supabase } from '../supabase/client';
import { getProfile, type Profile } from '../supabase/queryHelpers/getProfile';
import { hasAcceptedCurrentTerms } from '../utils/legal';
import { safeNextPath } from './requireAdminSession';

/**
 * `/lag-medlemsprofil`: signed out, the page asks for an email and a code; signed in, it shows
 * the first-time setup for the profile it returns here. A member who has already finished
 * setup for the current terms goes on to `neste`, or Min side. A failing profile read is a
 * fault for the error boundary, not a reason to ask a signed-in member to sign in again.
 */
export async function onboardingLoader({
  request,
}: LoaderFunctionArgs): Promise<{ profile: Profile | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { profile: null };
  const profile = await getProfile(user.id);
  if (hasAcceptedCurrentTerms(profile.terms_accepted_version)) {
    const next = new URL(request.url).searchParams.get('neste');
    throw redirect(safeNextPath(next, '/medlemsportal'));
  }
  return { profile };
}
