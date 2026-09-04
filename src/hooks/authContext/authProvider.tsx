import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import AuthContext from './authContext';
import { supabase } from '../../supabase/client';
import { getProfile } from '../../supabase/queryHelpers/getProfile';
import type { Profile } from '../../supabase/queryHelpers/getProfile';
import { isBoardAdmin } from '../../supabase/queryHelpers/isBoardAdmin';

// supabase-js already persists the session (and the JWT it carries) in its own storage;
// `getSession()` below is the one source of truth for it. These are stale keys from a mirror
// this provider used to keep alongside that — a second copy of the JWT, the full profile
// (including a signed photo URL that expires), and a client-editable admin flag. None of it is
// written anymore (#95); this only clears out what a browser might still be holding from before.
function clearLegacyAuthStorage() {
  try {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('isAdmin');
  } catch {
    // Storage access can throw (private browsing, disabled storage) — nothing to clean up then.
  }
}

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  const isAuthenticated = !!token;

  const probeAdminStatus = useCallback(async () => {
    try {
      const adminStatus = await isBoardAdmin();
      setIsAdmin(adminStatus);
      return adminStatus;
    } catch {
      setIsAdmin(false);
      return false;
    }
  }, []);

  const clearAuthState = useCallback(() => {
    setToken(null);
    setUser(null);
    setIsAdmin(false);
  }, []);

  const login = (userData: Profile) => {
    setUser(userData);
  };

  const refreshSession = useCallback(async () => {
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session) {
      clearAuthState();
      return false;
    }

    setToken(data.session.access_token ?? null);
    // Refetched rather than trusted from a cache — `user` never survives a reload on its own,
    // by design (#95).
    const profile = await getProfile(data.session.user.id).catch(() => null);
    setUser(profile);
    await probeAdminStatus();
    return true;
  }, [clearAuthState, probeAdminStatus]);

  const logout = async () => {
    await supabase.auth.signOut();
    clearAuthState();
  };

  useEffect(() => {
    clearLegacyAuthStorage();
    void refreshSession();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setToken(session?.access_token ?? null);

      if (!session) {
        setUser(null);
        setIsAdmin(false);
        return;
      }

      void probeAdminStatus();
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, [probeAdminStatus, refreshSession]);

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, token, user, isAdmin, login, logout, refreshSession }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
