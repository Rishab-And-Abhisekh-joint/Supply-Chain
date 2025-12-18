'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// Types
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
  company?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (data: SignupData) => Promise<boolean>;
  logout: () => void;
}

interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: string;
  company?: string;
  licenseNumber?: string;
  location?: {
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  paymentMethod?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Public routes that don't require authentication
const publicRoutes = ['/login', '/signup', '/forgot-password'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Check for existing session on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Redirect logic
  useEffect(() => {
    if (!isLoading) {
      const isPublicRoute = publicRoutes.includes(pathname);
      
      if (!user && !isPublicRoute) {
        // Not authenticated and trying to access protected route
        router.push('/signup');
      } else if (user && isPublicRoute) {
        // Authenticated and trying to access public route
        router.push('/');
      }
    }
  }, [user, isLoading, pathname, router]);

  const checkAuth = async () => {
    try {
      // Check localStorage for existing session
      const storedUser = localStorage.getItem('supplychain_user');
      const token = localStorage.getItem('supplychain_token');

      if (storedUser && token) {
        // Verify token with backend (in production)
        // For now, just restore the user
        const userData = JSON.parse(storedUser);
        setUser(userData);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('supplychain_user');
      localStorage.removeItem('supplychain_token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);

      // API call to backend
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        // For demo, allow mock login
        if (email === 'demo@example.com' && password === 'demo123') {
          const mockUser: User = {
            id: 'demo-user-1',
            email: 'demo@example.com',
            firstName: 'Demo',
            lastName: 'User',
            phone: '+91 9876543210',
            role: 'admin',
          };
          
          setUser(mockUser);
          localStorage.setItem('supplychain_user', JSON.stringify(mockUser));
          localStorage.setItem('supplychain_token', 'demo-token-123');
          router.push('/');
          return true;
        }
        throw new Error('Invalid credentials');
      }

      const data = await response.json();
      setUser(data.user);
      localStorage.setItem('supplychain_user', JSON.stringify(data.user));
      localStorage.setItem('supplychain_token', data.token);
      router.push('/');
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: SignupData): Promise<boolean> => {
    try {
      setIsLoading(true);

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        // For demo, simulate successful signup
        console.log('API not available, simulating signup...');
        
        const mockUser: User = {
          id: `user-${Date.now()}`,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          role: data.role,
          company: data.company,
        };
        
        setUser(mockUser);
        localStorage.setItem('supplychain_user', JSON.stringify(mockUser));
        localStorage.setItem('supplychain_token', `token-${Date.now()}`);
        
        console.log('=== SIGNUP SUCCESSFUL ===');
        console.log('User:', mockUser);
        console.log('=========================');
        
        router.push('/');
        return true;
      }

      const responseData = await response.json();
      setUser(responseData.user);
      localStorage.setItem('supplychain_user', JSON.stringify(responseData.user));
      localStorage.setItem('supplychain_token', responseData.token);
      router.push('/');
      return true;
    } catch (error) {
      console.error('Signup failed:', error);
      
      // Fallback for demo
      const mockUser: User = {
        id: `user-${Date.now()}`,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: data.role,
      };
      
      setUser(mockUser);
      localStorage.setItem('supplychain_user', JSON.stringify(mockUser));
      localStorage.setItem('supplychain_token', `token-${Date.now()}`);
      router.push('/');
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('supplychain_user');
    localStorage.removeItem('supplychain_token');
    router.push('/signup');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
      }}
    >
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

// Protected Route HOC
export function withAuth<P extends object>(WrappedComponent: React.ComponentType<P>) {
  return function ProtectedRoute(props: P) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.push('/signup');
      }
    }, [isAuthenticated, isLoading, router]);

    if (isLoading) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}