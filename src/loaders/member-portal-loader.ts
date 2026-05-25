import { redirect } from 'react-router-dom';
import { getProfile } from '../supabase/queryHelpers/getProfil';
import { supabase } from '../supabase/client';

export async function memberPortalLoader() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw redirect('/login?reason=not_authenticated');
  }

  const profile = await getProfile(user.id);

  return { profile };
}
