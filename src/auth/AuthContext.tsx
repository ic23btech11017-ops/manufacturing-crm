import React, { createContext, useContext, useState, useEffect } from 'react';
import { type AuthUser, type UserRole, DEMO_CREDENTIALS } from './roles';
import { setStoreActor } from '../demo/store';

const STORAGE_KEY = 'kalnet-auth-v1';

type LoginResult = { success: boolean; error?: string };

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => LoginResult;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function loadUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { version: number; user: AuthUser };
    if (parsed?.version === 1 && parsed.user?.role) return parsed.user;
  } catch {
    // ignore
  }
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = loadUser();
    if (stored) setStoreActor(stored.name, stored.role);
    else setStoreActor('System', 'system');
    return stored;
  });

  const login = (username: string, password: string): LoginResult => {
    const cred = DEMO_CREDENTIALS[username.toLowerCase()];
    if (!cred || cred.password !== password) {
      return { success: false, error: 'Invalid username or password.' };
    }
    const authUser: AuthUser = { ...cred.user, loggedInAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, user: authUser }));
    setStoreActor(authUser.name, authUser.role);
    setUser(authUser);
    return { success: true };
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setStoreActor('System', 'system');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
