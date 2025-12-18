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

  // Helper function to create demo/local user and store in localStorage
  const setLocalUser = useCallback((userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
  }, []);

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
            // Token invalid or API not available, use stored user for demo mode
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setToken(storedToken);
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
        setLocalUser(data.user, data.token);
        router.push('/dashboard');
        return { success: true };
      }

      // API returned an error - check if it's a "route not found" (backend not available)
      // or an actual authentication error
      let errorMessage = 'Login failed';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // Could not parse error JSON
      }

      // If route not found (404) or server error (5xx), fall back to demo mode
      if (response.status === 404 || response.status >= 500) {
        return handleDemoLogin(email, password);
      }

      // For other errors (401, 403, etc.), return the error
      return { success: false, error: errorMessage };
    } catch (error) {
      // Network error - fall back to demo mode
      return handleDemoLogin(email, password);
    }
  };

  // Helper function to handle demo login
  const handleDemoLogin = (email: string, password: string): { success: boolean; error?: string } => {
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
      
      setLocalUser(demoUser, demoToken);
      router.push('/dashboard');
      return { success: true };
    }

    return { 
      success: false, 
      error: 'Backend not available. Use demo@example.com / demo123 to try the demo.' 
    };
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
        setLocalUser(data.user, data.token);
        router.push('/dashboard');
        return { success: true };
      }

      // Check if backend is not available (404 route not found)
      if (response.status === 404 || response.status >= 500) {
        // Create local user for demo purposes
        return handleLocalSignup(userData);
      }

      // For other errors, try to get the error message
      let errorMessage = 'Signup failed';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // Could not parse error JSON
      }

      return { success: false, error: errorMessage };
    } catch (error) {
      // Network error - create local user for demo purposes
      return handleLocalSignup(userData);
    }
  };

  // Helper function to handle local/demo signup when backend is unavailable
  const handleLocalSignup = (userData: SignupData): { success: boolean; error?: string } => {
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
    
    setLocalUser(newUser, newToken);
    router.push('/dashboard');
    
    console.log('=== LOCAL SIGNUP (Demo Mode) ===');
    console.log('User:', newUser);
    console.log('Backend API not available - using local storage');
    console.log('================================');
    
    return { success: true };
  };

  const logout = useCallback(() => {
    // Try to call logout API (ignore errors)
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

      // If backend not available, update locally
      if (response.status === 404 || response.status >= 500) {
        const updatedUser = { ...user, ...userData };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return { success: true };
      }

      let errorMessage = 'Update failed';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // Could not parse error JSON
      }
      return { success: false, error: errorMessage };
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