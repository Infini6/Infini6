import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthUser, UserRole } from '../types/auth.types';
import { authService } from '../services/authService';
import { HospitalRow } from '../types/database.types';
import { apiService } from '../services/api';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => void;
  switchHospital: (hospitalId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    async function loadUser() {
      try {
        const initialUser = await authService.getInitialSession();
        if (mounted) {
          setUser(initialUser);
        }
      } catch (err) {
        console.error('[Auth] Initial session error:', err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }
    loadUser();
    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const authUser = await authService.signInWithEmail(email, pass);
      setUser(authUser);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.signOut();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const switchRole = (role: UserRole) => {
    const updated = authService.switchDemoRole(role);
    setUser(updated);
  };

  const switchHospital = async (hospitalId: string) => {
    if (!user) return;
    const newHospital = await apiService.getHospitalById(hospitalId);
    if (newHospital) {
      setUser({
        ...user,
        hospital: newHospital,
        profile: {
          ...user.profile,
          hospital_id: hospitalId,
        },
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: Boolean(user),
        login,
        logout,
        switchRole,
        switchHospital,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
