import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import AuthContext from './authContext';
import { supabase } from '../../supabase/client';
import type { Profile } from '../../supabase/queryHelpers/getProfile';
import { isBoardAdmin } from '../../supabase/queryHelpers/isBoardAdmin';

const readLocalStorageValue = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const readLocalStorageJson = <T,>(key: string): T | null => {
  const rawValue = readLocalStorageValue(key);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    return null;
  }
};

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => readLocalStorageValue('authToken'));
  const [user, setUser] = useState<Profile | null>(() => readLocalStorageJson<Profile>('userData'));
  const [isAdmin, setIsAdmin] = useState<boolean>(
    () => readLocalStorageJson<boolean>('isAdmin') ?? false,
  );

  const isAuthenticated = !!token;

  const persistToken = useCallback((accessToken: string | null) => {
    if (accessToken) {
      localStorage.setItem('authToken', accessToken);
      return;
    }

    localStorage.removeItem('authToken');
  }, []);

  const persistUser = useCallback((userData: Profile | null) => {
    if (userData) {
      localStorage.setItem('userData', JSON.stringify(userData));
      return;
    }

    localStorage.removeItem('userData');
  }, []);

  const persistAdmin = useCallback((adminStatus: boolean) => {
    localStorage.setItem('isAdmin', JSON.stringify(adminStatus));
  }, []);

  const probeAdminStatus = useCallback(async () => {
    try {
      const adminStatus = await isBoardAdmin();
      setIsAdmin(adminStatus);
      persistAdmin(adminStatus);
      return adminStatus;
    } catch {
      setIsAdmin(false);
      persistAdmin(false);
      return false;
    }
  }, [persistAdmin]);

  const clearAuthState = useCallback(() => {
    setToken(null);
    setUser(null);
    setIsAdmin(false);
    persistToken(null);
    persistUser(null);
    localStorage.removeItem('isAdmin');
  }, [persistToken, persistUser]);

  const login = (userData: Profile) => {
    setUser(userData);
    persistUser(userData);
  };

  const refreshSession = useCallback(async () => {
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session) {
      clearAuthState();
      return false;
    }

    const nextToken = data.session.access_token ?? null;
    setToken(nextToken);
    persistToken(nextToken);
    await probeAdminStatus();
    return true;
  }, [clearAuthState, persistToken, probeAdminStatus]);

  const logout = async () => {
    await supabase.auth.signOut();
    clearAuthState();
  };

  useEffect(() => {
    void refreshSession();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextToken = session?.access_token ?? null;

      setToken(nextToken);
      persistToken(nextToken);

      if (!session) {
        setUser(null);
        persistUser(null);
        setIsAdmin(false);
        localStorage.removeItem('isAdmin');
        return;
      }

      void probeAdminStatus();
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, [persistToken, persistUser, probeAdminStatus, refreshSession]);

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, token, user, isAdmin, login, logout, refreshSession }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
