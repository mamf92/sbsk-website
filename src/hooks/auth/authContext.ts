import { createContext, useContext } from 'react';

export interface FullUser {
  name: string;
  email: string;
  bio: string | null;
  avatar: {
    url: string;
    alt: string;
  };
  banner: {
    url: string;
    alt: string;
  };
  accessToken: string;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  user: FullUser | null;
  login: (userData: FullUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

export default AuthContext;
