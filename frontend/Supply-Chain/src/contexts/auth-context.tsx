'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (userData: SignupData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => Promise<{ success: boolean; error?: string }>;
}

interface SignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Public routes that don't require authentication
const publicRoutes = ['/', '/login', '/signup', '/forgot-password'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const isAuthenticated = !!user && !!token;

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          // Verify token with backend
          const response = await fetch(`${API_URL}/api/auth/me`, {
            headers: {
              'Authorization': `Bearer ${storedToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
            setToken(storedToken);
          } else {
            // Token invalid, try to use stored user for demo mode
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser.email === 'demo@example.com') {
              setUser(parsedUser);
              setToken(storedToken);
            } else {
              // Clear invalid auth data
              localStorage.removeItem('authToken');
              localStorage.removeItem('user');
            }
          }
        } catch (error) {
          // API unavailable, use stored data for demo mode
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setToken(storedToken);
        }
      }

      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Handle routing based on auth state
  useEffect(() => {
    if (isLoading) return;

    const isPublicRoute = publicRoutes.includes(pathname);

    if (!isAuthenticated && !isPublicRoute) {
      // Not authenticated and trying to access protected route
      router.push('/signup');
    } else if (isAuthenticated && (pathname === '/login' || pathname === '/signup' || pathname === '/')) {
      // Authenticated and trying to access login/signup/home
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Try API login first
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        router.push('/dashboard');
        return { success: true };
      }

      const error = await response.json();
      return { success: false, error: error.message || 'Login failed' };
    } catch (error) {
      // Fallback to demo mode
      if (email === 'demo@example.com' && password === 'demo123') {
        const demoUser: User = {
          id: 'demo-user',
          email: 'demo@example.com',
          firstName: 'Demo',
          lastName: 'User',
          role: 'admin',
          company: 'Demo Company',
        };
        const demoToken = `demo-token-${Date.now()}`;
        
        setUser(demoUser);
        setToken(demoToken);
        localStorage.setItem('authToken', demoToken);
        localStorage.setItem('user', JSON.stringify(demoUser));
        router.push('/dashboard');
        return { success: true };
      }

      return { success: false, error: 'Unable to connect to server. Use demo@example.com / demo123' };
    }
  };

  const signup = async (userData: SignupData): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        router.push('/dashboard');
        return { success: true };
      }

      const error = await response.json();
      return { success: false, error: error.message || 'Signup failed' };
    } catch (error) {
      // Create local user for demo purposes
      const newUser: User = {
        id: `user-${Date.now()}`,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        role: userData.role,
        company: userData.company,
        address: userData.address,
        city: userData.city,
        state: userData.state,
        pincode: userData.pincode,
      };
      const newToken = `token-${Date.now()}`;
      
      setUser(newUser);
      setToken(newToken);
      localStorage.setItem('authToken', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      router.push('/dashboard');
      return { success: true };
    }
  };

  const logout = useCallback(() => {
    // Try to call logout API
    if (token) {
      fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }).catch(() => {
        // Ignore errors
      });
    }

    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    router.push('/login');
  }, [token, router]);

  const updateUser = async (userData: Partial<User>): Promise<{ success: boolean; error?: string }> => {
    if (!user || !token) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/update`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        return { success: true };
      }

      const error = await response.json();
      return { success: false, error: error.message || 'Update failed' };
    } catch (error) {
      // Update locally for demo mode
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return { success: true };
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, isAuthenticated, login, signup, logout, updateUser }}>
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