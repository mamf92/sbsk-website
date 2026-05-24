import { redirect } from 'react-router-dom';
import { getProfile } from '../supabase/queryHelpers/getProfil';
import { getMembers } from '../supabase/queryHelpers/getMembers';
import { supabase } from '../supabase/client';

export async function boardPortalLoader() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw redirect('/login?reason=not_authenticated');
  }

  const [profile, members] = await Promise.all([getProfile(user.id), getMembers()]);
  return { profile, members };
}
