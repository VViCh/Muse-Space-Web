"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import AuthModal from '@/components/AuthModal';

export interface User {
  id: number;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  isEmailVerified: boolean;
  profileImageUrl?: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
  isAuthModalOpen: boolean;
  showAuthModal: () => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const router = useRouter();

  const showAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const checkAuth = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('token');
    
    if (token) {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          logout();
        }
      } catch (error) {
        logout();
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

// We lazily import AuthModal to prevent circular dependency issues if any
  // Or we can just import it at the top. Let's assume it's imported at the top.
  // Wait, I will just render it here. Wait, actually I will import it at the top of the file.

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      isLoading, 
      login, 
      logout, 
      checkAuth,
      isAuthModalOpen,
      showAuthModal,
      closeAuthModal
    }}>
      {children}
      <AuthModal />
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
