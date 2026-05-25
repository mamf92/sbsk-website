import { redirect } from 'react-router-dom';
import { getProfile } from '../supabase/queryHelpers/getProfile';
import { getMembers } from '../supabase/queryHelpers/getMembers';
import { supabase } from '../supabase/client';

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
  } catch {
    throw redirect('/medlemsportal');
  }
}
