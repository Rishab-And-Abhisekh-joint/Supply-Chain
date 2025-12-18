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

// Helper to check if error indicates backend is unavailable
function isBackendUnavailable(status: number, errorMessage?: string): boolean {
  // Check HTTP status codes that indicate backend issues
  if (status === 404 || status >= 500) {
    return true;
  }
  // Check error message patterns that indicate route/backend issues
  if (errorMessage) {
    const unavailablePatterns = [
      'route not found',
      'not found',
      'cannot post',
      'cannot get',
      'econnrefused',
      'network error',
      'failed to fetch',
    ];
    const lowerMessage = errorMessage.toLowerCase();
    return unavailablePatterns.some(pattern => lowerMessage.includes(pattern));
  }
  return false;
}

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
          const parsedUser = JSON.parse(storedUser);
          // For demo mode, just use stored credentials without API verification
          setUser(parsedUser);
          setToken(storedToken);
        } catch (error) {
          // Invalid stored data, clear it
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
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
      router.push('/signup');
    } else if (isAuthenticated && (pathname === '/login' || pathname === '/signup' || pathname === '/')) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  // Demo login handler
  const handleDemoLogin = useCallback((email: string, password: string): { success: boolean; error?: string } => {
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
      error: 'Invalid credentials. Use demo@example.com / demo123 for demo access.' 
    };
  }, [setLocalUser, router]);

  // Local signup handler
  const handleLocalSignup = useCallback((userData: SignupData): { success: boolean; error?: string } => {
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
    console.log('User created:', newUser.email);
    console.log('================================');
    
    return { success: true };
  }, [setLocalUser, router]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      // Try to parse the response body
      let responseData: any = null;
      let errorMessage = '';
      try {
        const text = await response.text();
        if (text) {
          responseData = JSON.parse(text);
          errorMessage = responseData?.message || responseData?.error || text;
        }
      } catch {
        // Response wasn't JSON
      }

      // If successful API response
      if (response.ok && responseData?.user && responseData?.token) {
        setLocalUser(responseData.user, responseData.token);
        router.push('/dashboard');
        return { success: true };
      }

      // Check if backend is unavailable - fall back to demo mode
      if (isBackendUnavailable(response.status, errorMessage)) {
        console.log('Backend unavailable, using demo mode');
        return handleDemoLogin(email, password);
      }

      // Real authentication error from backend
      return { success: false, error: errorMessage || 'Login failed' };

    } catch (error) {
      // Network error - fall back to demo mode
      console.log('Network error, using demo mode:', error);
      return handleDemoLogin(email, password);
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

      // Try to parse the response body
      let responseData: any = null;
      let errorMessage = '';
      try {
        const text = await response.text();
        if (text) {
          responseData = JSON.parse(text);
          errorMessage = responseData?.message || responseData?.error || text;
        }
      } catch {
        // Response wasn't JSON
      }

      // If successful API response
      if (response.ok && responseData?.user && responseData?.token) {
        setLocalUser(responseData.user, responseData.token);
        router.push('/dashboard');
        return { success: true };
      }

      // Check if backend is unavailable - create local user
      if (isBackendUnavailable(response.status, errorMessage)) {
        console.log('Backend unavailable, creating local user');
        return handleLocalSignup(userData);
      }

      // Real error from backend (e.g., email already exists)
      return { success: false, error: errorMessage || 'Signup failed' };

    } catch (error) {
      // Network error - create local user
      console.log('Network error, creating local user:', error);
      return handleLocalSignup(userData);
    }
  };

  const logout = useCallback(() => {
    // Clear local state
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    router.push('/login');
  }, [router]);

  const updateUser = async (userData: Partial<User>): Promise<{ success: boolean; error?: string }> => {
    if (!user || !token) {
      return { success: false, error: 'Not authenticated' };
    }

    // For demo mode, just update locally
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    return { success: true };
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