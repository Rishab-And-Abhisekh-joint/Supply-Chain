'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

// ============================================================================
// TYPES
// ============================================================================

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
  avatar?: string;
}

interface SignupData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

interface AuthResult {
  success: boolean;
  error?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  signup: (data: SignupData) => Promise<AuthResult>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<AuthResult>;
}

// ============================================================================
// CONTEXT
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');
        
        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Error loading user:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // ============================================================================
  // LOGIN
  // ============================================================================

  const login = async (email: string, password: string): Promise<AuthResult> => {
    try {
      console.log('Attempting login for:', email);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('Login response:', data);

      if (data.success && data.user) {
        // Store user and token
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token || 'authenticated');
        
        setUser(data.user);
        
        // Redirect to dashboard
        router.push('/dashboard');
        
        return { success: true };
      } else {
        return { 
          success: false, 
          error: data.error || 'Invalid email or password' 
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: 'Unable to connect to server. Please try again.' 
      };
    }
  };

  // ============================================================================
  // SIGNUP
  // ============================================================================

  const signup = async (data: SignupData): Promise<AuthResult> => {
    try {
      console.log('Attempting signup for:', data.email);
      
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          phone: data.phone || '',
          role: data.role || 'user',
          company: data.company || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          pincode: data.pincode || '',
        }),
      });

      const result = await response.json();
      console.log('Signup response:', result);

      if (result.success && result.user) {
        // Store user and token
        localStorage.setItem('user', JSON.stringify(result.user));
        localStorage.setItem('token', result.token || 'authenticated');
        
        setUser(result.user);
        
        // Redirect to dashboard
        router.push('/dashboard');
        
        return { success: true };
      } else {
        return { 
          success: false, 
          error: result.error || 'Signup failed. Please try again.' 
        };
      }
    } catch (error) {
      console.error('Signup error:', error);
      return { 
        success: false, 
        error: 'Unable to connect to server. Please try again.' 
      };
    }
  };

  // ============================================================================
  // LOGOUT
  // ============================================================================

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    router.push('/login');
  };

  // ============================================================================
  // UPDATE USER
  // ============================================================================

  const updateUser = (data: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  // ============================================================================
  // CHANGE PASSWORD
  // ============================================================================

  const changePassword = async (currentPassword: string, newPassword: string): Promise<AuthResult> => {
    if (!user?.email) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        return { success: true };
      } else {
        return { 
          success: false, 
          error: data.error || 'Failed to change password' 
        };
      }
    } catch (error) {
      console.error('Change password error:', error);
      return { 
        success: false, 
        error: 'Unable to connect to server. Please try again.' 
      };
    }
  };

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    updateUser,
    changePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default AuthContext;