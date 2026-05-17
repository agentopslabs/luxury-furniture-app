
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem('ghl_access_token');
    if (storedToken) {
      setToken(storedToken);
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string) => {
    localStorage.setItem('ghl_access_token', newToken);
    document.cookie = `koreauth_session=${newToken}; path=/; SameSite=Strict; Secure`;

    const chatKeysToRemove = Object.keys(localStorage).filter(key =>
      key.startsWith('lc_') ||
      key.startsWith('leadconnector') ||
      key.startsWith('lc-chat') ||
      key.includes('chat-widget') ||
      key.includes('6a01ef3b205bf897ae837633') ||
      key.startsWith('msgsndr') ||
      key.startsWith('ghl_chat') ||
      key.startsWith('highlevel_chat')
    );
    chatKeysToRemove.forEach(key => localStorage.removeItem(key));

    const chatCookies = ['lc_chat_session', 'lc_visitor_id', 'leadconnector_chat', 'msgsndr_chat'];
    chatCookies.forEach(name => {
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
    });

    setToken(newToken);
    setIsAuthenticated(true);
    router.push('/dashboard');
  };

  const logout = () => {
    localStorage.removeItem('ghl_access_token');
    document.cookie = "koreauth_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    setToken(null);
    setIsAuthenticated(false);
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
