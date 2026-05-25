import { supabase } from '../supabase/client';
import { getProfile } from '../supabase/queryHelpers/getProfil';
import { useAuth } from './authContext/authContext';

interface LoginCredentials {
  email: string;
  password: string;
}

export const useAuthActions = () => {
  const { login, logout, refreshSession } = useAuth();

  const signInWithPassword = async ({ email, password }: LoginCredentials) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.session) {
      throw new Error(error?.message ?? 'Login failed');
    }

    const profile = await getProfile(data.session.user.id);
    login(profile);
    await refreshSession();
    return profile;
  };

  const signOut = async () => {
    await logout();
  };

  return {
    signInWithPassword,
    signOut,
  };
};
