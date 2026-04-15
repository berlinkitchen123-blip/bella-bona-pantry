import type { ReactNode } from 'react';
import { createContext, useContext, useState } from 'react';
import type {  User  } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = (email: string, _password: string): boolean => {
    // Domain-based filtering: @bellabona.com → admin, anything else → customer
    const isAdmin = email.toLowerCase().endsWith('@bellabona.com');
    const name = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    setUser({
      email,
      name,
      company: isAdmin ? 'Bella & Bona' : deriveCompany(email),
      companyAddress: isAdmin ? 'HQ Address' : '123 Business Rd, Berlin',
      role: isAdmin ? 'admin' : 'customer',
    });
    return true;
  };

  const logout = () => setUser(null);

  const deriveCompany = (email: string): string => {
    const domain = email.split('@')[1]?.split('.')[0] || 'Company';
    return domain.charAt(0).toUpperCase() + domain.slice(1) + ' GmbH';
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
