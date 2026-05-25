import { supabase } from '../supabase/client';
import { getProfile } from '../supabase/queryHelpers/getProfile';
import { canViewMembers } from '../supabase/queryHelpers/canViewMembers';
import { useAuth } from './authContext/authContext';

interface LoginCredentials {
  email: string;
  password: string;
}

export const useAuthActions = () => {
  const { login, logout, refreshSession } = useAuth();

  const registerWithPassword = async ({ email, password }: LoginCredentials) => {
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error || !data.user) {
      throw new Error(error?.message ?? 'Registration failed');
    }

    const profile = await getProfile(data.user.id);
    login(profile);
    await refreshSession();
    const isAdmin = await canViewMembers();
    return { profile, isAdmin };
  };

  const signInWithPassword = async ({ email, password }: LoginCredentials) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.session) {
      throw new Error(error?.message ?? 'Login failed');
    }

    const profile = await getProfile(data.session.user.id);
    login(profile);
    await refreshSession();
    const isAdmin = await canViewMembers();
    return { profile, isAdmin };
  };

  const signOut = async () => {
    await logout();
  };

  return {
    signInWithPassword,
    signOut,
    registerWithPassword,
  };
};
