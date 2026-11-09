import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { api, setAuthToken, getAuthToken } from '../services/api';
import { wsClient } from '../services/websocket';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: any) => Promise<User>;
  logout: () => void;
  quickSwitchAccount: (userId: string) => Promise<User | null>;
  refreshUser: () => Promise<void>;
  verifyAge: (birthYear: number) => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const refreshUser = useCallback(async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      const res = await api.getMe();
      setUser(res.user);
      wsClient.setUserId(res.user.id);
    } catch (err: any) {
      console.warn('[Auth] Failed to load current user, defaulting to demo client:', err.message);
      // Fallback to demo client if invalid
      setAuthToken('usr_client_demo');
      try {
        const fallback = await api.getMe();
        setUser(fallback.user);
        wsClient.setUserId(fallback.user.id);
      } catch {
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    wsClient.connect();
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string): Promise<User> => {
    setError(null);
    try {
      const res = await api.login({ email, password });
      setAuthToken(res.token);
      setUser(res.user);
      wsClient.setUserId(res.user.id);
      return res.user;
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
      throw err;
    }
  };

  const register = async (payload: any): Promise<User> => {
    setError(null);
    try {
      const res = await api.register(payload);
      setAuthToken(res.token);
      setUser(res.user);
      wsClient.setUserId(res.user.id);
      return res.user;
    } catch (err: any) {
      setError(err.message || 'Error al registrar la cuenta');
      throw err;
    }
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
    wsClient.setUserId(null);
  };

  const quickSwitchAccount = async (userId: string): Promise<User | null> => {
    setIsLoading(true);
    setAuthToken(userId);
    try {
      const res = await api.getMe();
      setUser(res.user);
      wsClient.setUserId(res.user.id);
      return res.user;
    } catch (err: any) {
      console.error('[Auth] Quick switch failed:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyAge = async (birthYear: number) => {
    try {
      const res = await api.verifyAge(birthYear);
      setUser(res.user);
    } catch (err: any) {
      setError(err.message || 'Error al verificar edad');
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        quickSwitchAccount,
        refreshUser,
        verifyAge,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
