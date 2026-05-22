import { useState } from 'react';
import type { ReactNode } from 'react';
import type { FullUser } from '../auth/authContext';
import AuthContext from '../auth/authContext';

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('authToken');
    } catch {
      return null;
    }
  });
  const [user, setUser] = useState<FullUser | null>(() => {
    try {
      const userData = localStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  });

  const isAuthenticated = !!token && !!user;

  const login = (userData: FullUser) => {
    setUser(userData);
    setToken(userData.accessToken);
    localStorage.setItem('authToken', userData.accessToken);
    localStorage.setItem('userData', JSON.stringify(userData));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
  };
  return (
    <AuthContext.Provider value={{ isAuthenticated, token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
